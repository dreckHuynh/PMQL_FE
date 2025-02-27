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
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  Input,
  Form,
  Selection,
} from "@heroui/react";
import { Team } from "@prisma/client";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/apiRequest";
import { useLoading } from "@/context/LoadingContext";

export default function TeamsPage() {
  const { setLoading } = useLoading();
  const user = useAuth();
  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedData, setSelectedData] = useState<Team | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [teams, setTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const rowsPerPage = 10;

  const fetchTeams = async (page = 1) => {
    try {
      setLoading(true);
      const result = await apiRequest<Team[]>({
        url: `/teams?page=${page}&limit=${rowsPerPage}`,
      });

      if (result.success) {
        setTeams(result.data || []);
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
    fetchTeams(page);
  }, [page]);

  const validate = (data: { [k: string]: FormDataEntryValue }) => {
    const validationErrors: Record<string, string> = {};
    if (!data.team_name) validationErrors.full_name = "Yêu cầu nhập tên tổ";
    return validationErrors;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const newErrors = validate(data);
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);
      const result = await apiRequest<Team>({
        url: "/teams",
        method: selectedData ? "PUT" : "POST",
        body: {
          ...data,
          created_by: selectedData ? data.username : user?.username,
          updated_by: user?.username,
        },
        showToast: true,
      });

      if (result.success) {
        fetchTeams();
        onClose();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="mb-4 h-11">
        <Button onPress={onOpen} className="mr-4">
          Tạo tổ
        </Button>

        <Button
          onPress={() => {
            onOpen();
            const selectedKeysArray = Array.from(selectedKeys) as number[];
            const selectedId: number = selectedKeysArray[0];
            setSelectedData(teams[selectedId] || null);
          }}
          color="warning"
          isDisabled={!Array.from(selectedKeys).length}
          className="mr-4"
        >
          Cập nhật
        </Button>
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
          <TableColumn key="team_name">Tên tổ</TableColumn>
          <TableColumn key="created_by">Thời gian tạo</TableColumn>
        </TableHeader>

        {/* Dynamically Generate Table Rows */}
        <TableBody
          isLoading={isLoading}
          loadingContent={<Spinner label="Loading..." />}
        >
          {teams.map((item, index) => (
            <TableRow key={index}>
              <TableCell>{item.team_name || "-"}</TableCell>
              <TableCell>
                {new Date(item.created_at || "").toLocaleDateString()}
              </TableCell>
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
          {(onClose) => (
            <Form onSubmit={handleSubmit} validationErrors={errors}>
              <ModalHeader className="flex flex-col gap-1">
                Create Customer
              </ModalHeader>
              <ModalBody className="w-full">
                <Input
                  label="Tên tổ"
                  isRequired
                  name="team_name"
                  labelPlacement="outside"
                  placeholder="Nhập tên tổ"
                  variant="bordered"
                  defaultValue={selectedData?.team_name}
                />
              </ModalBody>

              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose}>
                  Đóng
                </Button>
                <Button color="primary" type="submit">
                  {selectedData ? "Cập nhật" : "Tạo tổ"}
                </Button>
              </ModalFooter>
            </Form>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
