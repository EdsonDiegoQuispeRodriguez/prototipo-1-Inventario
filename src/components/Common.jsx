import React from 'react';import {Card,Tag,Button,Space,Typography} from 'antd';import {EyeOutlined} from '@ant-design/icons';
export const tagStatus=s=><Tag color={s==='DISPONIBLE'||s==='Entregada'||s==='Recibida'||s==='Liberada'?'green':s==='BLOQUEADO'?'red':s==='En tránsito'?'blue':'gold'}>{s||'—'}</Tag>;
export function PageHeading({title,subtitle,extra}){return <div className="page-heading"><div><Typography.Title level={3} style={{marginBottom:5}}>{title}</Typography.Title><Typography.Text type="secondary">{subtitle}</Typography.Text></div>{extra}</div>}
export function StatCard({title,value,color,icon}){return <Card className="stat-card" style={{borderTop:`4px solid ${color}`}}><div className="stat-label">{title}</div><div className="stat-number">{icon} {value}</div></Card>}
export function DetailButton({record,onOpen}){return <Button icon={<EyeOutlined/>} onClick={()=>onOpen(record)}>Ver ficha</Button>}
