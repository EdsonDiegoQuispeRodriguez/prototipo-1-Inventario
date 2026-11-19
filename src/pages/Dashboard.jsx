import React, { useMemo, useState } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Select,
  Space,
  Button,
} from "antd";
import { useInventory } from "../context/InventoryContext";
import { PageHeading } from "../components/Common";
const money = (n) =>
  `S/ ${Number(n || 0).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export default function Dashboard({ navigate }) {
  const { db, warehouses, role, available } = useInventory();
  const [scope, setScope] = useState("ALL");
  const assets = useMemo(
    () => db.assets.filter((a) => scope === "ALL" || a.warehouse === scope),
    [db, scope],
  );
  const stats = [
    ["Activos registrados", assets.length],
    ["Disponibles", assets.filter((a) => available(a)).length],
    ["Asignados", assets.filter((a) => a.status === "ASIGNADO").length],
    ["En tránsito", assets.filter((a) => a.status === "EN TRÁNSITO").length],
    [
      "Recepciones pendientes",
      db.requests.filter(
        (r) =>
          ["Ingreso", "Devolución"].includes(r.type) &&
          r.status === "Pendiente de recepción" &&
          (scope === "ALL" || r.from === scope),
      ).length,
    ],
    [
      "Solicitudes",
      db.requests.filter(
        (r) => scope === "ALL" || r.from === scope || r.to === scope,
      ).length,
    ],
  ];
  const value = assets.reduce((n, a) => n + (Number(a.cost) || 0), 0),
    availableValue = assets
      .filter((a) => available(a))
      .reduce((n, a) => n + (Number(a.cost) || 0), 0);
  const sup = Object.values(
    assets.reduce((o, a) => {
      const key = a.superintendence || "Sin superintendencia";
      o[key] ??= { key, count: 0, available: 0, assigned: 0, value: 0 };
      o[key].count++;
      o[key].available += available(a);
      o[key].assigned += a.status === "ASIGNADO" ? 1 : 0;
      o[key].value += Number(a.cost) || 0;
      return o;
    }, {}),
  ).sort((a, b) => b.value - a.value);
  return (
    <>
      <PageHeading
        title="Dashboard de Inventario"
        subtitle="Existencias, valorización registrada y distribución por superintendencia"
      />
      <Card className="main-card" style={{ marginBottom: 16 }}>
        <Space wrap>
          <b>Almacenes:</b>
          <Select
            style={{ width: 220 }}
            value={scope}
            onChange={setScope}
            options={[
              { value: "ALL", label: "Todos los almacenes" },
              ...warehouses.map((w) => ({ value: w, label: w })),
            ]}
          />
        </Space>
      </Card>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        {stats.map(([title, value]) => (
          <Col xs={12} md={8} xl={4} key={title}>
            <Card className="main-card">
              <Statistic title={title} value={value} />
            </Card>
          </Col>
        ))}
      </Row>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} md={12}>
          <Card className="main-card">
            <Statistic
              title="Valor total registrado"
              value={value}
              precision={2}
              prefix="S/ "
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card className="main-card">
            <Statistic
              title="Valor de activos disponibles"
              value={availableValue}
              precision={2}
              prefix="S/ "
            />
          </Card>
        </Col>
      </Row>
      <Card
        className="main-card"
        title="Valorización por superintendencia"
        style={{ marginBottom: 16 }}
      >
        <Table
          rowKey="key"
          dataSource={sup}
          columns={[
            { title: "Superintendencia", dataIndex: "key" },
            { title: "Activos", dataIndex: "count" },
            { title: "Disponibles", dataIndex: "available" },
            { title: "Asignados", dataIndex: "assigned" },
            { title: "Valor registrado", dataIndex: "value", render: money },
          ]}
          pagination={{ pageSize: 8 }}
        />
        <small>
          Los importes se calculan con el costo registrado por activo. No
          representan valor contable depreciado ni valor de mercado. Los activos
          sin costo registrado aportan S/ 0 al total.
        </small>
      </Card>
      {role !== "Usuario" && (
        <Card className="main-card" title="Últimos eventos">
          <Table
            rowKey="id"
            pagination={{ pageSize: 5 }}
            dataSource={db.events}
            columns={[
              { title: "Fecha", dataIndex: "date" },
              { title: "Evento", dataIndex: "action" },
              { title: "Detalle", dataIndex: "detail" },
              { title: "Perfil", dataIndex: "actor" },
            ]}
            scroll={{ x: 700 }}
          />
        </Card>
      )}
    </>
  );
}
