import React from "react";
import {
  Card,
  Table,
  Button,
  Descriptions,
  Tag,
  Space,
  Timeline,
  Empty,
} from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
export default function RequestDetail({ request, assets, onBack, extra }) {
  if (!request) return <Empty description="Solicitud no encontrada" />;
  const columns = [
    { title: "Código", dataIndex: "assetId" },
    {
      title: "Categoría",
      render: (_, l) =>
        assets.find((a) => a.id === l.assetId)?.subcategory || "—",
    },
    {
      title: "Modelo",
      render: (_, l) => assets.find((a) => a.id === l.assetId)?.model || "—",
    },
    {
      title: "Serie / IMEI",
      render: (_, l) => assets.find((a) => a.id === l.assetId)?.serial || "—",
    },
    {
      title: "Anaquel / ubicación",
      render: (_, l) =>
        l.locationCode ||
        assets.find((a) => a.id === l.assetId)?.location ||
        "Por definir",
    },
    {
      title: "Verificación",
      render: (_, l) =>
        request.type === "Ingreso" || request.type === "Devolución" ? (
          <Tag color={l.checked ? "green" : "orange"}>
            {l.checked ? "Verificado" : "Pendiente"}
          </Tag>
        ) : (
          "—"
        ),
    },
  ];
  return (
    <>
      <Card className="main-card" style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={onBack}>
          Volver al listado
        </Button>
      </Card>
      <Card
        className="main-card"
        title={`Detalle de solicitud · ${request.id}`}
      >
        <Descriptions bordered size="small" column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Tipo">{request.type}</Descriptions.Item>
          <Descriptions.Item label="Estado">
            <Tag color="blue">{request.status}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Almacén origen / receptor">
            {request.from}
          </Descriptions.Item>
          <Descriptions.Item label="Destino">
            {request.to || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Solicitante">
            {request.by}
          </Descriptions.Item>
          <Descriptions.Item label="Fecha">{request.date}</Descriptions.Item>
          <Descriptions.Item label="Ticket">
            {request.ticket || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Usuario destinatario">
            {request.user || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Motivo">
            {request.reason || "—"}
          </Descriptions.Item>
          <Descriptions.Item label="Tratamiento">
            {request.decision || "—"}
          </Descriptions.Item>
        </Descriptions>
      </Card>
      <Card
        className="main-card"
        style={{ marginTop: 16 }}
        title={`Activos de la solicitud (${request.lines.length})`}
      >
        <Table
          rowKey="assetId"
          dataSource={request.lines}
          columns={columns}
          pagination={{ pageSize: 10 }}
          scroll={{ x: 950 }}
        />
      </Card>
      {extra && (
        <Card
          className="main-card"
          style={{ marginTop: 16 }}
          title="Acciones de almacén"
        >
          {extra}
        </Card>
      )}
      <Card
        className="main-card"
        style={{ marginTop: 16 }}
        title="Historial de estados"
      >
        <Timeline
          items={(request.history || []).map((h) => ({
            children: `${h.date} · ${h.status} · ${h.by}`,
          }))}
        />
      </Card>
    </>
  );
}
