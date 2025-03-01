/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, FormEvent } from "react";
import {
  Table,
  Pagination,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Button,
  useDisclosure,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Form,
  Select,
  SelectItem,
  Spinner,
  Selection,
} from "@heroui/react";
import { User } from "@/types/user";
import { apiRequest } from "@/utils/apiRequest";
import { useAuth } from "@/context/AuthContext";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useLoading } from "@/context/LoadingContext";
import { USER_ROLES } from "@/utils/enum";
import { Team } from "@/types/team";

export default function EmployeesManagement() {
  const { setLoading } = useLoading();
  const user = useAuth();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedData, setSelectedData] = useState<User | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const result = await apiRequest<User[]>({
        url: `/employees?page=${page}&limit=${rowsPerPage}`,
      });

      if (result.success) {
        setUsers(result.data || []);
        setTotalPages(result.totalPages || 0);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  // Fetch users from API
  useEffect(() => {
    fetchEmployees(page);
  }, [page]);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const result = await apiRequest<Team[]>({
          url: "/teams",
        });

        if (result.success) {
          setTeams(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch users:", error);
      }
    };

    fetchTeams();
  }, []);

  const validate = (data: { [k: string]: FormDataEntryValue }) => {
    // Validate required fields
    const validationErrors: Record<string, string> = {};

    if (!data.username) validationErrors.username = "Username is required";
    if (!data.name) validationErrors.name = "Name is required";
    return validationErrors;
  };

  // Handle form submission
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedData) {
      if (!formData.has("status")) {
        formData.append("status", "1");
      }
      if (!formData.has("team_id")) {
        formData.append(
          "team_id",
          `${user?.team_id}` || `${teams?.[0]?.id}` || ""
        );
      }
      if (!formData.has("user_role")) {
        formData.append("user_role", "2");
      }
    }
    const data = Object.fromEntries(formData);

    const newErrors = validate(data);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }
    delete selectedData?.created_by;
    if (selectedData) {
      data.updated_by = Number(user?.id) as any;
      data.updated_at = new Date().toISOString();
    }

    const requestData = {
      ...selectedData,
      ...data,
    };

    try {
      setLoading(true);
      const response = await apiRequest({
        url: "/employees",
        method: selectedData ? "PUT" : "POST",
        body: requestData, // Send the prepared data
        showToast: true,
      });

      if (response.success) {
        await fetchEmployees();
        onClose();
      }
    } catch (error) {
      console.error("Error:", error);
      setErrors({ general: "An unexpected error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (id: number) => {
    try {
      setIsLoading(true);
      setLoading(true);
      const response = await apiRequest({
        url: "/employees/reset",
        method: "PUT",
        body: { id },
        showToast: true,
      });
      if (response.success) {
        await fetchEmployees();
        onClose();
      }
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  function getTeamNameById(id?: number | null) {
    const team = teams.find((team) => team.id === id);
    return team ? team.team_name : "";
  }

  return (
    <div>
      <div className="mb-4 h-11">
        {(user?.is_admin || user?.is_team_lead) && (
          <Button
            onPress={() => {
              onOpen();
              setSelectedData(null);
            }}
            color="primary"
            className="mr-4"
          >
            Thêm nhân viên
          </Button>
        )}
        <Button
          onPress={() => {
            onOpen();
            const selectedKeysArray = Array.from(selectedKeys) as number[];
            const selectedId: number = selectedKeysArray[0];
            setSelectedData(users[selectedId] || null);
          }}
          color="warning"
          isDisabled={!Array.from(selectedKeys).length}
        >
          Cập nhật
        </Button>
      </div>

      <Table
        aria-label="Employee Management Table"
        bottomContent={
          <div className="flex w-full justify-center">
            <Pagination
              isCompact
              showControls
              showShadow
              color="secondary"
              page={page}
              total={totalPages}
              onChange={(p) => setPage(p)}
            />
          </div>
        }
        classNames={{ wrapper: "min-h-[222px]" }}
        selectionMode="single"
        color="warning"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      >
        <TableHeader>
          <TableColumn key="username">Username</TableColumn>
          <TableColumn key="name">Tên</TableColumn>
          <TableColumn key="is_admin">Chức vụ</TableColumn>
          <TableColumn key="team_id">Tổ</TableColumn>
          <TableColumn key="status">Trạng thái</TableColumn>
          <TableColumn key="action"> </TableColumn>
        </TableHeader>
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading..." />}
        >
          {users.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.username}</TableCell>
              <TableCell>{item.name ?? "N/A"}</TableCell>
              <TableCell>
                {item.is_admin
                  ? "Admin"
                  : item.is_team_lead
                  ? "Tổ trưởng"
                  : "Tổ viên"}
              </TableCell>
              <TableCell>{getTeamNameById(item.team_id)}</TableCell>
              <TableCell>
                {item.status === "1" ? "Hoạt động" : "Không hoạt động"}
              </TableCell>
              <TableCell>
                {user?.is_admin && (
                  <Button
                    onPress={() => handleResetPassword(item.id)}
                    color="danger"
                  >
                    Reset mật khẩu
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal for Adding Employee */}
      <Modal
        isOpen={isOpen}
        placement="top-center"
        onOpenChange={onOpenChange}
        classNames={{
          backdrop: "z-40",
        }}
      >
        <ModalContent>
          {(onClose) => (
            <Form onSubmit={onSubmit} validationErrors={errors}>
              <ModalHeader className="flex flex-col gap-1">
                {selectedData ? "Cập nhật thông tin" : "Tạo khách hàng"}
              </ModalHeader>
              <ModalBody className="w-full">
                {/* Username */}
                <Input
                  label="Username"
                  name="username"
                  placeholder="Enter username"
                  variant="bordered"
                  labelPlacement="outside"
                  defaultValue={selectedData?.username}
                />

                {/* Full Name */}
                <Input
                  label="Full Name"
                  name="name"
                  placeholder="Enter full name"
                  variant="bordered"
                  labelPlacement="outside"
                  defaultValue={selectedData?.username}
                />

                {/* Team ID */}
                <Select
                  disableSelectorIconRotation
                  name="team_id"
                  label="Team"
                  placeholder="Chọn team chịu trách nhiệm"
                  labelPlacement="outside"
                  selectorIcon={<ChevronUpDownIcon />}
                  defaultSelectedKeys={
                    selectedData
                      ? [`${selectedData.team_id}` || ""]
                      : [`${user?.team_id}` || `${teams?.[0]?.id}`]
                  } // Ensure this is a string
                >
                  {teams?.length
                    ? teams.map((item) => (
                        <SelectItem key={item.id}>{item.team_name}</SelectItem>
                      ))
                    : null}
                </Select>

                {/* Role Selection */}
                <Select
                  isDisabled={!user?.is_admin}
                  disableSelectorIconRotation
                  name="user_role"
                  label="User Role"
                  labelPlacement="outside"
                  placeholder="Select a user role"
                  selectorIcon={<ChevronUpDownIcon />}
                  defaultSelectedKeys={
                    selectedData
                      ? [selectedData.is_team_lead ? "1" : "2"]
                      : ["2"]
                  } // Ensure this is a string
                >
                  {USER_ROLES.map((role) => (
                    <SelectItem key={String(role.key)}>{role.label}</SelectItem>
                  ))}
                </Select>

                {/* Status Select */}
                <Select
                  name="status"
                  label="Status"
                  labelPlacement="outside"
                  placeholder="Select status"
                  defaultSelectedKeys={[selectedData?.status || "1"]}
                >
                  <SelectItem key="1">Active</SelectItem>
                  <SelectItem key="0">Inactive</SelectItem>
                </Select>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Đóng
                </Button>
                <Button color="primary" type="submit">
                  {selectedData ? "Cập nhật" : "Tạo"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
