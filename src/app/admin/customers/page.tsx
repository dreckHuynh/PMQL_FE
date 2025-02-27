"use client";

import { FormEvent, useEffect, useState } from "react";
import {
  Table,
  Pagination,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
  Button,
  Spinner,
  ModalFooter,
  Select,
  SelectItem,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Input,
  Form,
  Selection,
  Textarea,
} from "@heroui/react";
import { Customer, Team } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/apiRequest";
import { CUSTOMER_STATUS, ROLE_NOTE } from "@/utils/enum";
import { formatDateTime } from "@/utils/formatDateTime";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useLoading } from "@/context/LoadingContext";

export default function CustomerManagement() {
  const { setLoading } = useLoading();
  const user = useAuth();

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedData, setSelectedData] = useState<Customer | null>(null);
  const [deletedData, setDeletedData] = useState<Customer | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;

  // Fetch users from API
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

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const result = await apiRequest<Customer[]>({
        url: `/customers?page=${page}&limit=${rowsPerPage}`,
      });

      if (result.success) {
        setCustomers(result.data || []);
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
    fetchCustomers(page);
  }, [page]);

  const validate = (data: { [k: string]: FormDataEntryValue }) => {
    const validationErrors: Record<string, string> = {};

    // Validate full_name
    if (!data.full_name) validationErrors.full_name = "Full name is required";

    // Validate phone_number
    if (!data.phone_number)
      validationErrors.phone_number = "Phone number is required";
    else if (!/^\d{10,15}$/.test(data.phone_number.toString()))
      validationErrors.phone_number =
        "Phone number must be between 10 and 15 digits";

    // Validate year_of_birth
    if (!data.year_of_birth)
      validationErrors.year_of_birth = "Year of birth is required";

    // Validate team_id
    if (!data.team_id) validationErrors.team_id = "Team is required";

    // Validate status
    if (!data.status) validationErrors.status = "Status is required";

    // Validate role_note
    if (!data.role_note) validationErrors.role_note = "Role note is required";

    // Optional: Validate note (check if it's a string before checking length)
    if (data.note && typeof data.note === "string" && data.note.length > 500)
      validationErrors.note = "Note cannot be longer than 500 characters";

    return validationErrors;
  };

  const createCustomer = async (data: { [k: string]: FormDataEntryValue }) => {
    try {
      const result = await apiRequest<Customer>({
        url: "/customers",
        method: "POST",
        body: {
          ...data,
          status: data.status || "0",
          role_note: data.role_note || "0",
          team_id: Number(data.team_id || user?.team_id || teams?.[0]?.id),

          created_by: Number(user?.id),
          updated_by: Number(user?.id),
        },
        showToast: true,
      });

      if (result.success) {
        fetchCustomers();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateCustomer = async (data: { [k: string]: FormDataEntryValue }) => {
    try {
      const result = await apiRequest<Customer>({
        url: "/customers",
        method: "PUT",
        body: {
          ...selectedData,
          ...data,
          team_id: Number(data.team_id || selectedData?.team_id),
          updated_by: Number(user?.id),
        },
        showToast: true,
      });

      if (result.success) {
        fetchCustomers();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    if (!selectedData) {
      if (!formData.has("status")) formData.append("status", "0");
      if (!formData.has("team_id"))
        formData.append(
          "team_id",
          `${user?.team_id}` || `${teams?.[0]?.id}` || ""
        );
      if (!formData.has("role_note")) formData.append("role_note", "0");
    }

    const data = Object.fromEntries(formData);
    const newErrors = validate(data);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    if (selectedData) {
      await updateCustomer(data);
    } else {
      await createCustomer(data);
    }
  };

  const getCustomerStatusLabel = (key: string | null): string | undefined => {
    return (
      CUSTOMER_STATUS.find((status) => `${status.key}` === key)?.label || "-"
    );
  };

  const deleteCustomer = async () => {
    try {
      setLoading(true);
      const result = await apiRequest({
        url: `/customers/${deletedData?.id}`,
        method: "DELETE",
        showToast: true,
      });
      if (result.success) {
        fetchCustomers();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="mb-4">
        <Button
          onPress={() => {
            onOpen();
            setSelectedData(null);
            setDeletedData(null);
          }}
          color="primary"
          className="mr-4"
        >
          Thêm khách hàng
        </Button>

        {(user?.is_admin || user?.is_team_lead) && (
          <>
            <Button
              onPress={() => {
                const selectedKeysArray = Array.from(selectedKeys) as number[];
                const selectedId: number = selectedKeysArray[0];
                setSelectedData(customers[selectedId] || null);
                setDeletedData(null);
                onOpen();
              }}
              color="warning"
              isDisabled={!Array.from(selectedKeys).length}
              className="mr-4"
            >
              Cập nhật
            </Button>

            <Button
              onPress={() => {
                const selectedKeysArray = Array.from(selectedKeys) as number[];
                const selectedId: number = selectedKeysArray[0];
                setSelectedData(null);
                setDeletedData(customers[selectedId] || null);
                onOpen();
              }}
              color="danger"
              isDisabled={!Array.from(selectedKeys).length}
            >
              Xóa
            </Button>
          </>
        )}
      </div>

      <Table
        aria-label="Customer Table"
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
        selectionMode="single"
        color="warning"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
      >
        {/* Dynamically Generate Table Headers */}
        <TableHeader className="sticky top-0 bg-white shadow-md z-10">
          <TableColumn key="team_id">Tổ</TableColumn>
          <TableColumn key="full_name">Họ và tên</TableColumn>
          <TableColumn key="year_of_birth">Năm sinh</TableColumn>
          <TableColumn key="status">Trạng thái</TableColumn>
          <TableColumn key="note">Ghi chú</TableColumn>
          <TableColumn key="created_at">Thời gian nhập</TableColumn>
          <TableColumn key="note">Thời gian chốt khách</TableColumn>
          <TableColumn key="note">Người chốt khách</TableColumn>
        </TableHeader>

        {/* Dynamically Generate Table Rows */}
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading..." />}
        >
          {customers.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.team_id || "-"}</TableCell>
              <TableCell>{item.full_name || "-"}</TableCell>
              <TableCell>{item.year_of_birth || "-"}</TableCell>
              <TableCell>{getCustomerStatusLabel(item.status)}</TableCell>
              <TableCell>{item.note || "-"}</TableCell>
              <TableCell>{formatDateTime(item.created_at)}</TableCell>
              <TableCell>
                {item.status === "2" && formatDateTime(item.updated_at)}
              </TableCell>
              <TableCell>{item.updated_by || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        placement="top-center"
        onOpenChange={onOpenChange}
        classNames={{
          backdrop: "z-40",
        }}
      >
        <ModalContent>
          {(onClose) =>
            deletedData ? (
              <>
                <ModalHeader className="flex flex-col gap-1">
                  Xóa khách hàng
                </ModalHeader>
                <ModalBody className="w-full">
                  Bạn có chắc chắn muốn xóa khách hàng: {deletedData.full_name}
                </ModalBody>

                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Đóng
                  </Button>
                  <Button color="danger" type="button" onPress={deleteCustomer}>
                    Xóa
                  </Button>
                </ModalFooter>
              </>
            ) : (
              <Form onSubmit={handleSubmit} validationErrors={errors}>
                <ModalHeader className="flex flex-col gap-1">
                  {selectedData
                    ? "Cập nhật thông tin khách hàng"
                    : "Tạo khách hàng"}
                </ModalHeader>
                <ModalBody className="w-full">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Họ và tên"
                      isRequired
                      name="full_name"
                      labelPlacement="outside"
                      placeholder="Nhập họ và tên"
                      variant="bordered"
                      defaultValue={selectedData?.full_name}
                    />

                    <Select
                      isRequired
                      label="Năm sinh"
                      name="year_of_birth"
                      placeholder="Nhập năm sinh"
                      labelPlacement="outside"
                      defaultSelectedKeys={[selectedData?.year_of_birth || ""]}
                    >
                      {Array.from({ length: 100 }, (_, i) => {
                        const year = (new Date().getFullYear() - i).toString(); // Convert to string
                        return <SelectItem key={year}>{year}</SelectItem>;
                      })}
                    </Select>

                    <Input
                      isRequired
                      label="Số điện thoại"
                      name="phone_number"
                      placeholder="Nhập số điện thoại"
                      labelPlacement="outside"
                      maxLength={10} // Adjust max length as needed
                      variant="bordered"
                      type="tel" // Best practice for phone inputs
                      defaultValue={selectedData?.phone_number}
                    />

                    <Select
                      isDisabled={!user?.is_admin}
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
                      }
                    >
                      {teams.length
                        ? teams?.map((item) => (
                            <SelectItem key={item.id}>
                              {item.team_name}
                            </SelectItem>
                          ))
                        : null}
                    </Select>

                    <Select
                      isDisabled={!selectedData}
                      disableSelectorIconRotation
                      name="status"
                      label="Trạng thái"
                      labelPlacement="outside"
                      placeholder="Chọn trạng thái khách hàng"
                      selectorIcon={<ChevronUpDownIcon />}
                      defaultSelectedKeys={
                        selectedData ? [selectedData?.status] : ["0"]
                      } // Ensure this is a string
                    >
                      {CUSTOMER_STATUS.map((status) => (
                        <SelectItem key={String(status.key)}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </Select>

                    <Select
                      disableSelectorIconRotation
                      name="role_note"
                      label="Role note"
                      labelPlacement="outside"
                      placeholder="Chọn Role note"
                      selectorIcon={<ChevronUpDownIcon />}
                      defaultSelectedKeys={
                        selectedData ? [`${selectedData?.role_note}`] : ["0"]
                      } // Ensure this is a string
                    >
                      {ROLE_NOTE.map((item) => (
                        <SelectItem key={String(item.key)}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </Select>
                  </div>

                  <Textarea
                    name="note"
                    label="Ghi chú"
                    labelPlacement="outside"
                    placeholder="Nhập ghi chú"
                    variant="bordered"
                    defaultValue={selectedData?.note}
                  />
                </ModalBody>

                <ModalFooter>
                  <Button color="danger" variant="flat" onPress={onClose}>
                    Đóng
                  </Button>
                  <Button color="default" type="submit">
                    {selectedData ? "Cập nhật" : deletedData ? "Xóa" : "Tạo"}
                  </Button>
                </ModalFooter>
              </Form>
            )
          }
        </ModalContent>
      </Modal>
    </div>
  );
}
