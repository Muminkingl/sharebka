"use client";

import { Menu, X } from "lucide-react";
import { useState, type ReactNode } from "react";

export function Navigation6({
  brand,
  nameSlot,
  actions,
  menu,
}: {
  brand: ReactNode;
  nameSlot?: ReactNode;
  actions: ReactNode;
  menu?: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <header className="navigation-6">
      <div className="navigation-6-left">
        <button className="navigation-6-menu" type="button" aria-label="Open menu" onClick={() => setOpen((value) => !value)}>
          {open ? <X /> : <Menu />}
        </button>
        <div className="navigation-6-brand">{brand}</div>
        {nameSlot}
      </div>
      <div className="navigation-6-actions">{actions}</div>
      {open && menu && <div className="navigation-6-popover">{menu}</div>}
    </header>
  );
}
