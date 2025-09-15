// components/packages/PackageDetails.tsx
'use client'

type Props = {
  trackingNumber: string
  controlNumber: string
  userCode: string
  customerName: string
  branch: string
  shipper: string
  description: string
  weight: number
  pieces?: number
  dimensions?: { length?: number; width?: number; height?: number; cubes?: number }
  statusName: string
}

export default function PackageDetails(props: Props) {
  const d = props.dimensions || {}
  return (
    <div className="space-y-2 text-sm">
      <div className="grid grid-cols-2 gap-2">
        <div><span className="text-gray-500">Tracking:</span> {props.trackingNumber}</div>
        <div><span className="text-gray-500">Control:</span> {props.controlNumber}</div>
        <div><span className="text-gray-500">UserCode:</span> {props.userCode}</div>
        <div><span className="text-gray-500">Customer:</span> {props.customerName}</div>
        <div><span className="text-gray-500">Branch:</span> {props.branch}</div>
        <div><span className="text-gray-500">Status:</span> {props.statusName}</div>
        <div><span className="text-gray-500">Shipper:</span> {props.shipper}</div>
        <div><span className="text-gray-500">Weight:</span> {props.weight} kg</div>
        {props.pieces !== undefined && (
          <div><span className="text-gray-500">Pieces:</span> {props.pieces}</div>
        )}
        {(d.length || d.width || d.height) && (
          <div><span className="text-gray-500">Dimensions:</span> {d.length || 0}×{d.width || 0}×{d.height || 0} cm</div>
        )}
        {d.cubes !== undefined && (
          <div><span className="text-gray-500">Cubes:</span> {d.cubes}</div>
        )}
      </div>
      {props.description && (
        <p className="text-gray-700 mt-2">{props.description}</p>
      )}
    </div>
  )
}
