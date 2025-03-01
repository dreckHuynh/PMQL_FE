import { redirect } from "next/navigation";

export default function NotFound() {
  redirect("/admin/customers"); // Redirect to home page
  return null; // Prevents rendering anything
}
