"use client";

import Store from "../store/store";
import { Provider } from "react-redux";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <Provider store={Store}>{children}</Provider>;
}
