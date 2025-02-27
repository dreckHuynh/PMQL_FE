"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Spinner,
  Tabs,
  Tab,
  Chip,
  Button,
} from "@heroui/react";
import { apiRequest } from "@/utils/apiRequest";
import { ROLE_NOTE } from "@/utils/enum";
import { CallCount } from "@/types/statistical";
import { exportToExcel } from "@/utils/exportToExcel";
import { useLoading } from "@/context/LoadingContext";

export default function StatisticalPage() {
  const { setLoading, loading } = useLoading();
  const [data, setData] = useState<CallCount[]>([]);
  const [selected, setSelected] = useState<string>("");

  const TABS = [{ key: null, label: null }, ...ROLE_NOTE];

  // Fetch users from API
  useEffect(() => {
    const fetchStatistical = async (roleNote?: string) => {
      setLoading(true);
      try {
        const result = await apiRequest<CallCount[]>({
          url: `/statistical?role_note=${roleNote}`,
        });

        if (result.success) {
          setData(result.data || []);
        }
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistical(selected);
  }, [selected]);

  const getRankColor = (
    index: number
  ): "success" | "primary" | "warning" | "danger" | "secondary" | "default" => {
    const colors: (
      | "success"
      | "primary"
      | "warning"
      | "danger"
      | "secondary"
      | "default"
    )[] = [
      "success", // 🥇 1st - Green
      "primary", // 🥈 2nd - Blue
      "warning", // 🥉 3rd - Yellow
      "danger", // 4th - Red
      "secondary", // 5th - Purple
      "success", // 6th - Green
      "primary", // 7th - Blue
      "warning", // 8th - Yellow
      "danger", // 9th - Red
      "default", // 10th - Gray
    ];

    return colors[index] ?? "default"; // Ensure it only returns allowed types
  };

  const exportExcel = () => {
    const formattedCallCounts = data.map((item, index) => ({
      Top: index + 1, // Add ranking field
      "Số lượng khách gọi": item.call_count,
      "Người gọi": item.caller,
      Tổ: item.team_name,
    }));

    exportToExcel(formattedCallCounts);
  };

  return (
    <div className="">
      <div className="mb-4 h-11">
        <Button onPress={exportExcel}>Export</Button>
      </div>

      <Tabs
        aria-label="Role Options"
        selectedKey={selected}
        onSelectionChange={(key) => setSelected(String(key))}
        color="warning"
        radius="full"
      >
        {TABS.map((role) => (
          <Tab key={role.label} title={role.label || "Bảng xếp hạng tổng"}>
            <Table isStriped aria-label="Call Count Table">
              <TableHeader>
                <TableColumn>Top</TableColumn>
                <TableColumn>Tổ</TableColumn>
                <TableColumn>Người gọi</TableColumn>
                <TableColumn>Số lượng khách gọi</TableColumn>
              </TableHeader>
              <TableBody
                isLoading={loading}
                loadingContent={<Spinner label="Loading..." />}
              >
                {data.map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Chip
                        color={getRankColor(index)}
                        variant="solid"
                        className="w-8 h-8 flex items-center justify-center rounded-full font-bold text-white"
                      >
                        {index + 1}
                      </Chip>
                    </TableCell>
                    <TableCell>{row.team_name || "N/A"}</TableCell>
                    <TableCell>{row.caller || "Unknown"}</TableCell>
                    <TableCell>{row.call_count ?? 0}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}
