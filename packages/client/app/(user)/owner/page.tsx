"use client";

import { useAuth } from "@/context/auth-context";

const OwnerPage = () => {
  const { user } = useAuth();

  console.log(user);

  return <div>OwnerPage</div>;
};

export default OwnerPage;
