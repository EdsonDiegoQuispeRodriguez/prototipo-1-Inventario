import React, { useState } from "react";
import { EyeOutlined } from "@ant-design/icons";
import RequestDetail from "../components/RequestDetail";
import {
  Card,
  Form,
  Input,
  InputNumber,
  Select,
  Row,
  Col,
  Button,
  Switch,
  message,
  Divider,
  Table,
  Space,
  Tag,
  Alert,
} from "antd";
import { useInventory } from "../context/InventoryContext";
import { PageHeading } from "../components/Common";
import { fields } from "../data/seed";
const choices = {
  condition: ["NUEVO", "USADO", "AVERIADO"],
  category: [
    "NETWORKING",
    "END USERS",
    "PERIFÉRICO",
    "ACCESORIOS",
    "REPUESTOS",
    "HERRAMIENTAS",
    "HARDWARE",
  ],
  type: [
    "LAPTOP",
    "SWITCH",
    "MONITOR",
    "CONSUMIBLE",
    "REPUESTO",
    "HERRAMIENTA",
    "OTRO",
  ],
};
export default function Entry() {
  const { db, warehouses, createEntryRequest } = useInventory();
  const [form] = Form.useForm();
  const [items, setItems] = useState([]);
  const [from, setFrom] = useState(null);
  const [reason, setReason] = useState("");
  const [screen, setScreen] = useState("list");
  const [selected, setSelected] = useState(null);
  const add = (v) => {
    setItems((c) => [...c, { ...v, _key: Date.now() + "-" + Math.random() }]);
    form.resetFields();
    message.success("Activo agregado a la solicitud (aún no disponible)");
  };
  const submit = () => {
    if (!from || !items.length)
      return message.warning("Selecciona almacén y agrega activos");
    const id = createEntryRequest(items, from, reason);
    if (!id) return message.error("No se pudo generar la solicitud");
    message.success(`Solicitud ${id} enviada al almacén`);
    setItems([]);
    setReason("");
    setScreen("list");
  };
  const requests = db.requests.filter((r) => r.type === "Ingreso");
  return (
    <>
      <PageHeading
        title="Ingresos de inventario"
        subtitle="Supervisor crea una solicitud con múltiples activos; almacén verifica cada unidad antes de habilitarla"
      />
      <Card className="main-card" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="primary"
            onClick={() => setScreen(screen === "list" ? "create" : "list")}
          >
            {screen === "list"
              ? "Nueva solicitud de ingreso"
              : "Volver a solicitudes"}
          </Button>
        </Space>
      </Card>
      {selected ? (
        <RequestDetail
          request={db.requests.find((r) => r.id === selected)}
          assets={db.assets}
          onBack={() => setSelected(null)}
        />
      ) : screen === "list" ? (
        <Card className="main-card" title="Solicitudes de ingreso">
          <Table
            rowKey="id"
            dataSource={requests}
            columns={[
              { title: "Solicitud", dataIndex: "id" },
              { title: "Almacén", dataIndex: "from" },
              { title: "Activos", render: (_, r) => r.lines.length },
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
              { title: "Fecha", dataIndex: "date" },
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
      ) : (
        <>
          <Card className="main-card" title="1. Datos del nuevo activo">
            <Alert
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
              message="Agrega tantos activos como necesites. Se registrarán como PENDIENTE INGRESO y solo serán disponibles al cerrar la recepción física."
            />
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                quantity: 1,
                serialized: true,
                condition: "NUEVO",
              }}
              onFinish={add}
            >
              <Row gutter={16}>
                {fields
                  .filter(
                    ([key]) =>
                      ![
                        "status",
                        "substatus",
                        "warehouse",
                        "shelf",
                        "row",
                        "column",
                        "location",
                      ].includes(key),
                  )
                  .map(([key, label]) => (
                    <Col xs={24} md={12} xl={8} key={key}>
                      <Form.Item
                        label={label}
                        name={key}
                        rules={
                          ["category", "model"].includes(key)
                            ? [{ required: true, message: "Campo obligatorio" }]
                            : []
                        }
                      >
                        {key === "quantity" ? (
                          <InputNumber
                            min={1}
                            precision={0}
                            style={{ width: "100%" }}
                          />
                        ) : key === "cost" ? (
                          <InputNumber min={0} style={{ width: "100%" }} />
                        ) : choices[key] ? (
                          <Select
                            showSearch
                            allowClear
                            options={choices[key].map((x) => ({
                              label: x,
                              value: x,
                            }))}
                          />
                        ) : key === "notes" ? (
                          <Input.TextArea rows={2} />
                        ) : key === "received" ? (
                          <Input type="date" />
                        ) : (
                          <Input placeholder={label} />
                        )}
                      </Form.Item>
                    </Col>
                  ))}
              </Row>
              <Form.Item
                name="serialized"
                label="Control por serie"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
              <Button type="primary" htmlType="submit">
                Agregar a solicitud
              </Button>
            </Form>
          </Card>
          <Card
            className="main-card"
            style={{ marginTop: 16 }}
            title={`2. Solicitud de ingreso (${items.reduce((n, a) => n + (Number(a.quantity) || 1), 0)} unidades)`}
          >
            <Space wrap style={{ marginBottom: 16 }}>
              <Select
                placeholder="Seleccionar almacén receptor"
                value={from}
                onChange={setFrom}
                style={{ width: 230 }}
                options={warehouses.map((w) => ({ value: w, label: w }))}
              />
            </Space>
            <Table
              rowKey="_key"
              dataSource={items}
              pagination={false}
              columns={[
                { title: "Categoría", dataIndex: "category" },
                { title: "Modelo", dataIndex: "model" },
                { title: "Serie", dataIndex: "serial" },
                { title: "Unidades", dataIndex: "quantity" },
                {
                  title: "",
                  render: (_, r) => (
                    <Button
                      danger
                      onClick={() =>
                        setItems((a) => a.filter((x) => x._key !== r._key))
                      }
                    >
                      Quitar
                    </Button>
                  ),
                },
              ]}
            />
            <Divider />
            <Input.TextArea
              rows={2}
              placeholder="Referencia / OC / observaciones generales"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              style={{ marginTop: 14 }}
              type="primary"
              disabled={!items.length || !from}
              onClick={submit}
            >
              Enviar solicitud de ingreso al almacén
            </Button>
          </Card>
        </>
      )}
    </>
  );
}
