// La raíz "/" redirige automáticamente al login
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");
}
