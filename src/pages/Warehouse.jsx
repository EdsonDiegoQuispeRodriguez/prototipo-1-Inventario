import React, { useState } from "react";
import {
  Card,
  Table,
  Button,
  Select,
  Alert,
  message,
  Popconfirm,
  Space,
  Tag,
  Typography,
} from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useInventory } from "../context/InventoryContext";
import { PageHeading, tagStatus } from "../components/Common";
import RequestDetail from "../components/RequestDetail";
export default function Warehouse({ returns = false }) {
  const {
    db,
    warehouse,
    setWarehouse,
    warehouses,
    locationOptions,
    advanceRequest,
    checkReception,
    closeReception,
  } = useInventory();
  const [selected, setSelected] = useState(null),
    [locations, setLocations] = useState({});
  const reception = db.requests.filter(
    (r) =>
      ["Ingreso", "Devolución"].includes(r.type) &&
      r.from === warehouse &&
      r.status === "Pendiente de recepción",
  );
  const tasks = db.requests.filter(
    (r) =>
      (r.from === warehouse &&
        ["Pendiente de preparación", "En preparación"].includes(r.status)) ||
      (r.to === warehouse && r.status === "En tránsito"),
  );
  const selectedRequest = db.requests.find((r) => r.id === selected);
  const receiveActions =
    selectedRequest &&
    ["Ingreso", "Devolución"].includes(selectedRequest.type) &&
    selectedRequest.status === "Pendiente de recepción" &&
    selectedRequest.from === warehouse;
  const taskActions =
    selectedRequest &&
    ["Salida", "Transferencia"].includes(selectedRequest.type) &&
    tasks.some((r) => r.id === selectedRequest.id);
  const confirm = () => {
    if (advanceRequest(selectedRequest.id))
      message.success("Solicitud completa actualizada");
    else message.error("No se pudo confirmar");
  };
  const actions = receiveActions ? (
    <>
      <Alert
        type="info"
        showIcon
        message="Selecciona el anaquel, fila y columna para cada activo antes de marcar su recepción. Los cambios se aplican al cerrar la solicitud."
        style={{ marginBottom: 16 }}
      />
      <Table
        rowKey="assetId"
        pagination={false}
        dataSource={selectedRequest.lines}
        columns={[
          { title: "Activo", dataIndex: "assetId" },
          {
            title: "Modelo",
            render: (_, l) => db.assets.find((a) => a.id === l.assetId)?.model,
          },
          {
            title: "Serie",
            render: (_, l) =>
              db.assets.find((a) => a.id === l.assetId)?.serial || "—",
          },
          {
            title: "Ubicación física",
            render: (_, l) => (
              <Select
                showSearch
                optionFilterProp="label"
                style={{ minWidth: 260 }}
                disabled={l.checked}
                placeholder="Anaquel · fila · columna"
                value={l.locationCode || locations[l.assetId]}
                onChange={(v) =>
                  setLocations((x) => ({ ...x, [l.assetId]: v }))
                }
                options={locationOptions}
              />
            ),
          },
          {
            title: "Check físico",
            render: (_, l) => (
              <Button
                type={l.checked ? "primary" : "default"}
                onClick={() => {
                  const ok = checkReception(
                    selectedRequest.id,
                    l.assetId,
                    !l.checked,
                    l.checked ? undefined : locations[l.assetId],
                  );
                  if (ok)
                    message.success(
                      l.checked
                        ? "Verificación revertida"
                        : "Activo verificado",
                    );
                  else
                    message.warning(
                      "Selecciona la ubicación física antes de verificar",
                    );
                }}
              >
                {l.checked ? "✓ Verificado" : "Marcar recibido"}
              </Button>
            ),
          },
        ]}
        scroll={{ x: 950 }}
      />
      <Popconfirm
        title="¿Cerrar toda la solicitud?"
        onConfirm={() =>
          closeReception(selectedRequest.id)
            ? message.success("Recepción cerrada e inventario actualizado")
            : message.error("Verifica todos los activos y sus ubicaciones")
        }
      >
        <Button
          type="primary"
          disabled={selectedRequest.lines.some(
            (l) => !l.checked || !l.locationCode,
          )}
          style={{ marginTop: 16 }}
        >
          Cerrar recepción completa
        </Button>
      </Popconfirm>
    </>
  ) : taskActions ? (
    <Popconfirm
      title={`¿Confirmar ${selectedRequest.lines.length} activos?`}
      onConfirm={confirm}
    >
      <Button type="primary">
        {selectedRequest.status === "Pendiente de preparación"
          ? "Iniciar preparación"
          : selectedRequest.status === "En preparación"
            ? "Despachar solicitud completa"
            : "Confirmar recepción completa"}
      </Button>
    </Popconfirm>
  ) : null;
  return (
    <>
      <PageHeading
        title={returns ? "Recepción de devoluciones" : "Operaciones de almacén"}
        subtitle="Solicitudes agrupadas, verificación individual y cierre por solicitud completa"
      />
      <Card className="main-card" style={{ marginBottom: 16 }}>
        <Space wrap>
          <b>Almacén operativo:</b>
          <Select
            style={{ width: 190 }}
            value={warehouse}
            onChange={(v) => {
              setWarehouse(v);
              setSelected(null);
            }}
            options={warehouses.map((w) => ({ value: w, label: w }))}
          />
        </Space>
      </Card>
      {selected ? (
        <RequestDetail
          request={selectedRequest}
          assets={db.assets}
          onBack={() => setSelected(null)}
          extra={actions}
        />
      ) : (
        <>
          <Card
            className="main-card"
            title={`Recepciones pendientes (${reception.length})`}
            style={{ marginBottom: 18 }}
          >
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 12 }}
              message="Ingresos y devoluciones se reciben en una misma bandeja. Abre el detalle para registrar anaqueles y verificar los activos."
            />
            <Table
              rowKey="id"
              dataSource={reception}
              columns={[
                { title: "Solicitud", dataIndex: "id" },
                {
                  title: "Tipo",
                  render: (_, r) =>
                    r.type === "Devolución"
                      ? `Devolución · ${r.decision}`
                      : "Ingreso",
                },
                { title: "Activos", render: (_, r) => r.lines.length },
                {
                  title: "Verificados",
                  render: (_, r) =>
                    `${r.lines.filter((l) => l.checked).length}/${r.lines.length}`,
                },
                { title: "Solicitado por", dataIndex: "by" },
                {
                  title: "Detalle",
                  render: (_, r) => (
                    <Button
                      icon={<EyeOutlined />}
                      onClick={() => setSelected(r.id)}
                    >
                      Ver detalle
                    </Button>
                  ),
                },
              ]}
            />
          </Card>
          {!returns && (
            <Card
              className="main-card"
              title={`Despachos y transferencias (${tasks.length})`}
            >
              <Table
                rowKey="id"
                dataSource={tasks}
                columns={[
                  { title: "Solicitud", dataIndex: "id" },
                  { title: "Tipo", dataIndex: "type" },
                  { title: "Activos", render: (_, r) => r.lines.length },
                  { title: "Origen", dataIndex: "from" },
                  { title: "Destino", dataIndex: "to" },
                  { title: "Estado", dataIndex: "status", render: tagStatus },
                  {
                    title: "Detalle",
                    render: (_, r) => (
                      <Button
                        icon={<EyeOutlined />}
                        onClick={() => setSelected(r.id)}
                      >
                        Ver detalle
                      </Button>
                    ),
                  },
                ]}
              />
            </Card>
          )}
        </>
      )}
    </>
  );
}
