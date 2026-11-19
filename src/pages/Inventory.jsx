import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Input,
  Select,
  Space,
  Tag,
  Button,
  Descriptions,
  Tabs,
  Drawer,
  Segmented,
  Statistic,
  Row,
  Col,
} from "antd";
import { SearchOutlined, EyeOutlined } from "@ant-design/icons";
import { useInventory } from "../context/InventoryContext";
import { fields } from "../data/seed";
import { PageHeading, tagStatus } from "../components/Common";
const money = (n) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function Inventory({ detailId, setDetailId }) {
  const { db, warehouse, setWarehouse, warehouses, role, available } =
    useInventory();
  const [q, setQ] = useState(""),
    [category, setCategory] = useState(""),
    [scope, setScope] = useState("ALL"),
    [view, setView] = useState("individual"),
    [group, setGroup] = useState(null);
  const data = useMemo(
    () =>
      db.assets.filter(
        (a) =>
          (scope === "ALL" || a.warehouse === scope) &&
          (!category || a.category === category) &&
          `${a.id} ${a.model} ${a.brand} ${a.serial} ${a.location} ${a.warehouse}`
            .toLowerCase()
            .includes(q.toLowerCase()) &&
          (role !== "Usuario" || available(a) > 0),
      ),
    [db, scope, role, q, category],
  );
  const grouped = useMemo(() => {
    const map = new Map();
    data.forEach((a) => {
      const key = [a.category, a.subcategory, a.brand, a.model].join("|");
      if (!map.has(key))
        map.set(key, {
          key,
          category: a.category,
          subcategory: a.subcategory,
          brand: a.brand,
          model: a.model,
          items: [],
          stock: 0,
          value: 0,
        });
      const g = map.get(key);
      g.items.push(a);
      g.stock += available(a);
      g.value += Number(a.cost) || 0;
    });
    return [...map.values()];
  }, [data, db]);
  const asset = db.assets.find((a) => a.id === detailId);
  const selectedGroup = grouped.find((g) => g.key === group);
  const columns = [
    { title: "Código", dataIndex: "id" },
    { title: "Categoría", dataIndex: "subcategory" },
    { title: "Marca", dataIndex: "brand" },
    { title: "Modelo", dataIndex: "model" },
    { title: "Serie / IMEI", dataIndex: "serial", render: (v) => v || "—" },
    { title: "Almacén", dataIndex: "warehouse" },
    {
      title: "Superintendencia",
      dataIndex: "superintendence",
      render: (v) => v || "Sin asignar",
    },
    { title: "Estado", dataIndex: "status" },
    { title: "Condición", dataIndex: "condition" },
    { title: "Costo unitario", dataIndex: "cost", render: money },
    {
      title: "Disponible",
      render: (_, a) => (
        <Tag color={available(a) ? "green" : "red"}>{available(a)}</Tag>
      ),
    },
    {
      title: "Detalle",
      render: (_, a) => (
        <Button icon={<EyeOutlined />} onClick={() => setDetailId(a.id)}>
          Ver
        </Button>
      ),
    },
  ];
  return (
    <>
      <PageHeading
        title="Inventario general"
        subtitle="Vista individual o consolidada por modelo, con desglose de series, almacenes y valorización"
      />
      <Card className="main-card">
        <Space wrap style={{ marginBottom: 18 }}>
          <Select
            value={scope}
            onChange={(v) => {
              setScope(v);
              if (v !== "ALL") setWarehouse(v);
              setGroup(null);
            }}
            style={{ width: 210 }}
            options={[
              { value: "ALL", label: "Todos los almacenes" },
              ...warehouses.map((w) => ({ value: w, label: w })),
            ]}
          />
          <Input
            allowClear
            placeholder="Buscar código, serie, modelo..."
            prefix={<SearchOutlined />}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{ width: 280 }}
          />
          <Select
            allowClear
            placeholder="Categoría"
            value={category || undefined}
            onChange={(v) => setCategory(v || "")}
            style={{ width: 180 }}
            options={[...new Set(db.assets.map((a) => a.category))].map(
              (x) => ({ label: x, value: x }),
            )}
          />
          <Segmented
            value={view}
            onChange={(v) => {
              setView(v);
              setGroup(null);
            }}
            options={[
              { label: "Individual", value: "individual" },
              { label: "Agrupado por modelo", value: "agrupado" },
            ]}
          />
        </Space>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Statistic title="Activos visibles" value={data.length} />
          </Col>
          <Col span={12}>
            <Statistic
              title="Valor registrado de los activos visibles"
              value={data.reduce((n, a) => n + (Number(a.cost) || 0), 0)}
              prefix="S/ "
              precision={2}
            />
          </Col>
        </Row>
        {view === "individual" ? (
          <Table
            rowKey="id"
            dataSource={data}
            columns={columns}
            scroll={{ x: 1500 }}
            pagination={{ pageSize: 10 }}
          />
        ) : selectedGroup ? (
          <>
            <Button style={{ marginBottom: 14 }} onClick={() => setGroup(null)}>
              ← Volver a modelos
            </Button>
            <h3>
              {selectedGroup.brand} · {selectedGroup.model} (
              {selectedGroup.items.length} unidades)
            </h3>
            <Table
              rowKey="id"
              dataSource={selectedGroup.items}
              columns={columns}
              scroll={{ x: 1500 }}
              pagination={{ pageSize: 10 }}
            />
          </>
        ) : (
          <Table
            rowKey="key"
            dataSource={grouped}
            columns={[
              { title: "Categoría", dataIndex: "subcategory" },
              { title: "Marca", dataIndex: "brand" },
              { title: "Modelo", dataIndex: "model" },
              { title: "Unidades totales", render: (_, g) => g.items.length },
              { title: "Disponibles", dataIndex: "stock" },
              { title: "Valor registrado", dataIndex: "value", render: money },
              {
                title: "Desglose",
                render: (_, g) => (
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setGroup(g.key)}
                  >
                    Ver {g.items.length} series
                  </Button>
                ),
              },
            ]}
            pagination={{ pageSize: 10 }}
          />
        )}
      </Card>
      <Drawer
        width="min(850px, 96vw)"
        open={!!asset}
        onClose={() => setDetailId(null)}
        title={asset ? `Ficha del activo · ${asset.id}` : ""}
      >
        {asset && (
          <Tabs
            items={[
              {
                key: "general",
                label: "Información completa",
                children: (
                  <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
                    {fields.map(([k, label]) => (
                      <Descriptions.Item key={k} label={label}>
                        {asset[k] ?? "—"}
                      </Descriptions.Item>
                    ))}
                  </Descriptions>
                ),
              },
              {
                key: "history",
                label: "Trazabilidad",
                children: (
                  <Table
                    rowKey="id"
                    dataSource={db.events.filter(
                      (e) =>
                        String(e.detail).includes(asset.id) ||
                        String(e.detail).includes(asset.model),
                    )}
                    columns={[
                      { title: "Fecha", dataIndex: "date" },
                      { title: "Acción", dataIndex: "action" },
                      { title: "Detalle", dataIndex: "detail" },
                    ]}
                  />
                ),
              },
              {
                key: "status",
                label: "Estado y disponibilidad",
                children: (
                  <Descriptions bordered column={1}>
                    <Descriptions.Item label="Estado">
                      {tagStatus(asset.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Subestado">
                      {tagStatus(asset.substatus)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Disponible">
                      {available(asset)}
                    </Descriptions.Item>
                  </Descriptions>
                ),
              },
            ]}
          />
        )}
      </Drawer>
    </>
  );
}
