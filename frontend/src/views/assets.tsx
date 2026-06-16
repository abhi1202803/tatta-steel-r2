"use client";

import { useEffect, useState } from "react";
import { api, type Equipment } from "@/services/api";
import EquipmentTable from "@/components/dashboard/EquipmentTable";
import { TableSkeleton, PageHeaderSkeleton } from "@/components/Skeletons";

export default function AssetsPage() {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEquipment()
      .then(setEquipment)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div>
        <PageHeaderSkeleton />
        <TableSkeleton rows={8} cols={5} />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Asset Registry</h1>
        <p className="text-steel-100 text-sm mt-1">Equipment assets synced from Supabase PostgreSQL</p>
      </div>
      <EquipmentTable equipment={equipment} />
    </div>
  );
}
