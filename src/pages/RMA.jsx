import React, { useMemo, useState } from "react";
import {
  Card,
  Table,
  Select,
  Input,
  Button,
  Tag,
  Space,
  Alert,
  message,
  Badge,
  Descriptions,
} from "antd";
import { PageHeading } from "../components/Common";
import { useInventory } from "../context/InventoryContext";
export default function RMA() {
  const { db, warehouses, createRMARequest } = useInventory();
  const [screen, setScreen] = useState("list"),
    [from, setFrom] = useState(null),
    [decision, setDecision] = useState("Reingreso"),
    [reason, setReason] = useState(""),
    [q, setQ] = useState(""),
    [cart, setCart] = useState([]);
  const assigned = useMemo(
    () =>
      db.assets.filter(
        (a) =>
          a.status === "ASIGNADO" &&
          !db.requests.some(
            (r) =>
              r.type === "RMA" &&
              r.status !== "Cerrada" &&
              r.lines.some((l) => l.assetId === a.id),
          ) &&
          `${a.id} ${a.model} ${a.serial} ${a.user}`
            .toLowerCase()
            .includes(q.toLowerCase()),
      ),
    [db, q],
  );
  const submit = () => {
    if (!from || !cart.length || !reason.trim())
      return message.warning("Completa el almacén receptor, motivo y activos");
    const id = createRMARequest(cart, from, reason, decision);
    if (!id) return message.error("No se pudo generar RMA");
    message.success(`Solicitud ${id} enviada a ${from}`);
    setCart([]);
    setReason("");
    setScreen("list");
  };
  return (
    <>
      <PageHeading
        title="RMA · Reingresos y disposición"
        subtitle="Solicitudes agrupadas para recuperar equipos asignados o procesar su disposición final"
      />
      <Card className="main-card" style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          onClick={() => setScreen(screen === "list" ? "create" : "list")}
        >
          {screen === "list" ? "Nueva solicitud RMA" : "Volver al listado"}
        </Button>
      </Card>
      {screen === "list" ? (
        <Card className="main-card" title="Solicitudes RMA">
          <Table
            rowKey="id"
            dataSource={db.requests.filter((r) => r.type === "RMA")}
            columns={[
              { title: "Solicitud", dataIndex: "id" },
              { title: "Destino", dataIndex: "from" },
              { title: "Tratamiento", dataIndex: "decision" },
              { title: "Unidades", render: (_, r) => r.lines.length },
              {
                title: "Verificados",
                render: (_, r) => r.lines.filter((l) => l.checked).length,
              },
              {
                title: "Estado",
                dataIndex: "status",
                render: (v) => (
                  <Tag color={v === "Cerrada" ? "green" : "orange"}>{v}</Tag>
                ),
              },
            ]}
            expandable={{
              expandedRowRender: (r) => (
                <>
                  <Descriptions size="small">
                    <Descriptions.Item label="Motivo">
                      {r.reason}
                    </Descriptions.Item>
                  </Descriptions>
                  <Table
                    rowKey="assetId"
                    size="small"
                    pagination={false}
                    dataSource={r.lines}
                    columns={[
                      { title: "Código", dataIndex: "assetId" },
                      {
                        title: "Modelo",
                        render: (_, l) =>
                          db.assets.find((a) => a.id === l.assetId)?.model,
                      },
                      {
                        title: "Serie",
                        render: (_, l) =>
                          db.assets.find((a) => a.id === l.assetId)?.serial,
                      },
                      {
                        title: "Check",
                        render: (_, l) => (l.checked ? "✓" : "Pendiente"),
                      },
                    ]}
                  />
                </>
              ),
            }}
          />
        </Card>
      ) : (
        <>
          <Card className="main-card" title="1. Seleccionar activos asignados">
            <Alert
              showIcon
              type="info"
              style={{ marginBottom: 14 }}
              message="Solo se muestran equipos ASIGNADOS. Puedes seleccionar múltiples activos para una sola solicitud."
            />
            <Input.Search
              allowClear
              placeholder="Buscar por código, modelo, serie o usuario"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              style={{ maxWidth: 420, marginBottom: 16 }}
            />
            <Table
              rowKey="id"
              dataSource={assigned}
              pagination={{ pageSize: 10 }}
              columns={[
                { title: "Código", dataIndex: "id" },
                { title: "Modelo", dataIndex: "model" },
                { title: "Serie", dataIndex: "serial" },
                { title: "Usuario / referencia", dataIndex: "user" },
                { title: "Estado", dataIndex: "status" },
                {
                  title: "Acción",
                  render: (_, a) => (
                    <Button
                      disabled={cart.includes(a.id)}
                      onClick={() => setCart((c) => [...c, a.id])}
                    >
                      Agregar
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
          <Card
            className="main-card"
            style={{ marginTop: 16 }}
            title={
              <Space>
                2. Solicitud RMA <Badge count={cart.length} />
              </Space>
            }
          >
            <Table
              rowKey="id"
              pagination={false}
              dataSource={cart
                .map((id) => db.assets.find((a) => a.id === id))
                .filter(Boolean)}
              columns={[
                { title: "Código", dataIndex: "id" },
                { title: "Modelo", dataIndex: "model" },
                { title: "Serie", dataIndex: "serial" },
                {
                  title: "",
                  render: (_, a) => (
                    <Button
                      danger
                      onClick={() =>
                        setCart((c) => c.filter((id) => id !== a.id))
                      }
                    >
                      Quitar
                    </Button>
                  ),
                },
              ]}
            />
            <Space wrap style={{ margin: "16px 0" }}>
              <Select
                placeholder="Almacén receptor"
                style={{ width: 200 }}
                value={from}
                onChange={setFrom}
                options={warehouses.map((x) => ({ value: x, label: x }))}
              />
              <Select
                style={{ width: 230 }}
                value={decision}
                onChange={setDecision}
                options={[
                  { value: "Reingreso", label: "Reingreso a almacén (USADO)" },
                  { value: "DISPOSAL", label: "DISPOSAL (baja)" },
                ]}
              />
            </Space>
            <Input.TextArea
              rows={3}
              placeholder="Motivo de renovación / avería / ticket"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              type="primary"
              style={{ marginTop: 14 }}
              disabled={!cart.length}
              onClick={submit}
            >
              Enviar RMA a recepción
            </Button>
          </Card>
        </>
      )}
    </>
  );
}
