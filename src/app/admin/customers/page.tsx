"use client";

import { Copy } from "lucide-react";

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
  SortDescriptor,
  addToast,
} from "@heroui/react";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/utils/apiRequest";
import { CUSTOMER_STATUS, ROLE_NOTE } from "@/utils/enum";
import { formatDateTime } from "@/utils/formatDateTime";
import { ChevronUpDownIcon } from "@heroicons/react/24/outline";
import { useLoading } from "@/context/LoadingContext";
import { Customer } from "@/types/customer";
import { Team } from "@/types/team";
import { Search } from "lucide-react";
import { exportToExcel } from "@/utils/exportToExcel";

export default function CustomerManagement() {
  const { setLoading } = useLoading();
  const user = useAuth();

  const [selectedKeys, setSelectedKeys] = useState<Selection>(new Set([]));
  const [selectedData, setSelectedData] = useState<Customer | null>(null);
  const [deletedData, setDeletedData] = useState<Customer | null>(null);

  const { isOpen, onOpen, onClose, onOpenChange } = useDisclosure();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersCheck, setCustomersCheck] = useState<Customer[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchCheck, setSearchCheck] = useState("");

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageCheck, setPageCheck] = useState(1);
  const [totalPagesCheck, setTotalPagesCheck] = useState(1);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "created_at",
    direction: "ascending",
  });
  const [sortDescriptorCheck, setSortDescriptorCheck] =
    useState<SortDescriptor>({
      column: "updated_at",
      direction: "ascending",
    });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    alert(`Đã sao chép: ${text}`);
  };

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

  const fetchCustomersCheck = async (page = 1) => {
    try {
      setLoading(true);
      const result = await apiRequest<Customer[]>({
        url: `/customers/check?page=${page}&limit=${rowsPerPage}&search=${searchCheck}&order_by=${
          sortDescriptorCheck.column
        }&order_type=${
          sortDescriptorCheck.direction === "ascending" ? "asc" : "desc"
        }`,
      });

      if (result.success) {
        setCustomersCheck(result.data || []);
        setTotalPagesCheck(result.totalPages || 0);
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
      setLoading(false);
    }
  };

  const fetchCustomers = async (page = 1) => {
    try {
      setLoading(true);
      const result = await apiRequest<Customer[]>({
        url: `/customers?page=${page}&limit=${rowsPerPage}&search=${search}&order_by=${
          sortDescriptor.column
        }&order_type=${
          sortDescriptor.direction === "ascending" ? "asc" : "desc"
        }`,
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

  useEffect(() => {
    fetchCustomers(page);
  }, [page, sortDescriptor]);

  useEffect(() => {
    fetchCustomersCheck(pageCheck);
  }, [pageCheck, sortDescriptorCheck]);

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
      // Lấy thời gian hiện tại với định dạng "YYYY-MM-DD HH:mm:ss.SSS"
      const formatDate = (date: Date) => {
        const pad = (num: number, size: number = 2) =>
          String(num).padStart(size, "0");
        return (
          `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
          )} ` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
            date.getSeconds()
          )}.` +
          `${pad(date.getMilliseconds(), 3)}`
        );
      };

      const currentTime = formatDate(new Date());

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
          created_at: currentTime,
          updated_at: currentTime,
        },
        showToast: true,
      });

      if (result.success) {
        await fetchCustomers();
        await fetchCustomersCheck();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const updateCustomer = async (data: { [k: string]: FormDataEntryValue }) => {
    try {
      delete selectedData?.created_by;

      // Lấy thời gian hiện tại với định dạng "YYYY-MM-DD HH:mm:ss.SSS"
      const formatDate = (date: Date) => {
        const pad = (num: number, size: number = 2) =>
          String(num).padStart(size, "0");
        return (
          `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
            date.getDate()
          )} ` +
          `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(
            date.getSeconds()
          )}.` +
          `${pad(date.getMilliseconds(), 3)}`
        );
      };

      const currentTime = formatDate(new Date());

      const result = await apiRequest<Customer>({
        url: "/customers",
        method: "PUT",
        body: {
          ...selectedData,
          ...data,
          team_id: Number(data.team_id || selectedData?.team_id),
          updated_by: Number(user?.id),
          created_at: currentTime,
          updated_at: currentTime,
        },
        showToast: true,
      });

      if (result.success) {
        await fetchCustomers();
        await fetchCustomersCheck();
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

  const getCustomerStatusLabel = (key: string | null) => {
    const status = CUSTOMER_STATUS.find((status) => `${status.key}` === key);
    return status?.label || "";
  };

  const getCustomerRoleNoteLabel = (
    key?: string | null
  ): string | undefined => {
    return ROLE_NOTE.find((status) => `${status.key}` === key)?.label || "-";
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
        await fetchCustomers();
        await fetchCustomersCheck();
        onClose();
      }
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = async () => {
    try {
      setLoading(true);
      const result = await apiRequest<Customer[]>({
        url: `/customers/export`,
      });

      if (result.success) {
        const dataFormatted = result.data?.map((item) => ({
          ID: item.id,
          "Họ và tên": item.full_name,
          "Năm sinh": item.year_of_birth,
          "Số điện thoại": item.phone_number,
          "Ghi chú": item.note,
          "Người gọi": getCustomerRoleNoteLabel(item.role_note),
          "Trạng thái": getCustomerStatusLabel(item.status),
          Tổ: item.team_name,
          "Thời gian nhập": formatDateTime(item.created_at),
          "Thời gian chốt khách": item.updated_at
            ? formatDateTime(item.updated_at)
            : "",
        }));
        if (dataFormatted) {
          exportToExcel(dataFormatted);
        } else {
          addToast({
            title: "Error",
            description: "Có lỗi trong việc xuất file",
            color: "danger",
          });
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-center gap-y-4 sm:gap-y-0">
        <div className="flex flex-wrap gap-2">
          <Button
            onPress={() => {
              onOpen();
              setSelectedData(null);
              setDeletedData(null);
            }}
            color="primary"
          >
            Thêm khách hàng
          </Button>

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
            >
              Cập nhật
            </Button>
            {(user?.is_admin || user?.is_team_lead) && (
              <Button
                onPress={() => {
                  const selectedKeysArray = Array.from(
                    selectedKeys
                  ) as number[];
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
            )}
          </>
          <Button onPress={exportExcel} color="success">
            Xuất file Excel
          </Button>
        </div>
      </div>

      <div className="w-full flex gap-4">
        <Table
          aria-label="Customer Table"
          bottomContent={
            <div className="flex justify-center">
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
          topContent={
            <Input
              type="text"
              placeholder="Search..."
              endContent={
                <Button
                  isIconOnly
                  aria-label="Like"
                  color="secondary"
                  onPress={async () => {
                    await fetchCustomers();
                  }}
                >
                  <Search />
                </Button>
              }
              value={search}
              onChange={(val) => setSearch(val.target.value)}
              classNames={{
                inputWrapper: "pr-0",
              }}
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  await fetchCustomers();
                }
              }}
            />
          }
          onSortChange={setSortDescriptor}
          sortDescriptor={sortDescriptor}
        >
          {/* Dynamically Generate Table Headers */}
          <TableHeader className="sticky top-0 bg-white shadow-md z-10">
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="index"
              allowsSorting
            >
              ID/STT
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="full_name"
              allowsSorting
            >
              Họ và tên
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="year_of_birth"
              allowsSorting
            >
              Năm sinh
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="phone_number"
              allowsSorting
            >
              Số điện thoại
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="status"
              allowsSorting
            >
              Trạng thái
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="created_at"
              allowsSorting
            >
              Thời gian nhập
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="role_note"
              allowsSorting
            >
              Người gọi
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="note"
              allowsSorting
            >
              Ghi chú
            </TableColumn>
          </TableHeader>

          {/* Dynamically Generate Table Rows */}
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner label="Loading..." />}
          >
            {customers.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{Number(index) + 1}</TableCell>
                <TableCell>
                  {item.full_name || "-"}
                  {item.full_name && (
                    <Copy
                      className="ml-2 cursor-pointer text-gray-500 hover:text-black"
                      size={16}
                      onClick={() => handleCopy(item.full_name)}
                    />
                  )}
                </TableCell>
                <TableCell>{item.year_of_birth || "-"}</TableCell>
                <TableCell>
                  {item.phone_number ? item.phone_number.slice(-9) : "-"}
                  {item.phone_number && (
                    <Copy
                      className="ml-2 cursor-pointer text-gray-500 hover:text-black"
                      size={16}
                      onClick={() => handleCopy(item.phone_number.slice(-9))}
                    />
                  )}
                </TableCell>
                <TableCell>{getCustomerStatusLabel(item.status)}</TableCell>
                <TableCell>{formatDateTime(item.created_at)}</TableCell>
                <TableCell>
                  {getCustomerRoleNoteLabel(item.role_note)}
                </TableCell>
                <TableCell>{item.note || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Table
          aria-label="Customer Table"
          bottomContent={
            <div className="flex w-full justify-center">
              <Pagination
                isCompact
                showControls
                showShadow
                color="secondary"
                page={pageCheck}
                total={totalPagesCheck}
                onChange={(p) => setPageCheck(p)}
              />
            </div>
          }
          color="warning"
          // selectionMode="single"
          // selectedKeys={selectedKeys}
          // onSelectionChange={setSelectedKeys}
          topContent={
            <Input
              type="text"
              placeholder="Search..."
              endContent={
                <Button
                  isIconOnly
                  aria-label="Like"
                  color="secondary"
                  onPress={async () => {
                    await fetchCustomersCheck();
                  }}
                >
                  <Search />
                </Button>
              }
              value={searchCheck}
              onChange={(val) => setSearchCheck(val.target.value)}
              classNames={{
                inputWrapper: "pr-0",
              }}
              onKeyDown={async (event) => {
                if (event.key === "Enter") {
                  await fetchCustomersCheck();
                }
              }}
            />
          }
          onSortChange={setSortDescriptorCheck}
          sortDescriptor={sortDescriptorCheck}
        >
          {/* Dynamically Generate Table Headers */}
          <TableHeader className="sticky top-0 bg-white shadow-md z-10">
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="team_name"
              allowsSorting
            >
              Tổ
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="full_name"
              allowsSorting
            >
              Họ và tên
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="year_of_birth"
              allowsSorting
            >
              Năm sinh
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="status"
              allowsSorting
            >
              Trạng thái
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="role_note"
              allowsSorting
            >
              NV
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="note"
              allowsSorting
            >
              Ghi chú
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="created_at"
              width={180}
              allowsSorting
            >
              Thời gian nhập
            </TableColumn>
            <TableColumn
              className="bg-teal-500 text-white data-[hover=true]:text-gray-200"
              key="updated_at"
              width={180}
              allowsSorting
            >
              Thời gian chốt khách
            </TableColumn>
          </TableHeader>

          {/* Dynamically Generate Table Rows */}
          <TableBody
            isLoading={isLoading}
            loadingContent={<Spinner label="Loading..." />}
          >
            {customersCheck.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.team_name || "-"}</TableCell>
                <TableCell>{item.full_name || "-"}</TableCell>
                <TableCell>{item.year_of_birth || "-"}</TableCell>
                <TableCell>{getCustomerStatusLabel(item.status)}</TableCell>
                <TableCell>
                  {getCustomerRoleNoteLabel(item.role_note)}
                </TableCell>
                <TableCell>{item.note || "-"}</TableCell>
                <TableCell>{formatDateTime(item.created_at)}</TableCell>
                <TableCell>{formatDateTime(item.updated_at)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

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
                  <Button
                    color="danger"
                    type="button"
                    onPress={() => {
                      if (deletedData.status === "2") {
                        alert(
                          "Không thể xóa khách hàng này vì trạng thái không hợp lệ!"
                        );
                        return;
                      }
                      deleteCustomer();
                    }}
                  >
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
                          ? [`${selectedData.team_id}` || 1]
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
                      isDisabled={
                        !(user?.is_admin || user?.is_team_lead) &&
                        selectedData?.status === "2"
                      }
                      disableSelectorIconRotation
                      name="status"
                      label="Trạng thái"
                      labelPlacement="outside"
                      placeholder="Chọn trạng thái khách hàng"
                      selectorIcon={<ChevronUpDownIcon />}
                      defaultSelectedKeys={
                        selectedData ? [selectedData?.status] : ["1"]
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
                    defaultValue={selectedData?.note || ""}
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
