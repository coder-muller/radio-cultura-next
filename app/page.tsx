'use client'

import { getLocalStorage } from "@/lib/localStorage";
import { useEffect } from "react";


export default function Home() {

  useEffect(() => {

    const token = getLocalStorage("token");
    if (token) {
      window.location.href = "/clientes";
    }

  }, [])

  return (
    <>

    </>
  );
}
