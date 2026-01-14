import { useState, useEffect } from 'react'
import { useListVehiclesQuery } from '../../services/shipmentApi'
import { useGetUserSummariesQuery } from '../../services/userApi'

interface PlanShipmentModalProps {
    isOpen: boolean
    onClose: () => void
    onPlan: (data: {
        plannedDate: string
        vehicleId: string
        driverId?: string
    }) => void
    isLoading?: boolean
}

export default function PlanShipmentModal({
    isOpen,
    onClose,
    onPlan,
    isLoading = false
}: PlanShipmentModalProps) {
    const [plannedDate, setPlannedDate] = useState('')
    const [selectedVehicleId, setSelectedVehicleId] = useState('')
    const [selectedDriverIdForPlanning, setSelectedDriverIdForPlanning] = useState('')

    const { data: vehicles = [] } = useListVehiclesQuery()
    const { data: users = [] } = useGetUserSummariesQuery()

    useEffect(() => {
        if (!isOpen) {
            setPlannedDate('')
            setSelectedVehicleId('')
            setSelectedDriverIdForPlanning('')
        }
    }, [isOpen])

    const handleSubmit = () => {
        if (!plannedDate || !selectedVehicleId) {
            alert('Lütfen tarih ve araç seçiniz')
            return
        }
        onPlan({
            plannedDate: new Date(plannedDate).toISOString(),
            vehicleId: selectedVehicleId,
            driverId: selectedDriverIdForPlanning || undefined
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white border border-green-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                <h3 className="text-xl font-bold text-green-900 mb-4">Sevk Planlama</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-green-900 mb-2">Planlanan Sevk Tarihi</label>
                        <input
                            type="date"
                            value={plannedDate}
                            onChange={(e) => setPlannedDate(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-green-900 mb-2">Araç Seçimi</label>
                        <select
                            value={selectedVehicleId}
                            onChange={(e) => setSelectedVehicleId(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Araç Seçiniz</option>
                            {vehicles.map((vehicle) => (
                                <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate} - {vehicle.vehicleType}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-green-900 mb-2">Şoför Seçimi</label>
                        <select
                            value={selectedDriverIdForPlanning}
                            onChange={(e) => setSelectedDriverIdForPlanning(e.target.value)}
                            className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                            <option value="">Otomatik Ata (Giriş Yapan Kullanıcı)</option>
                            {users.map((user) => (
                                <option key={user.id} value={user.id}>{user.displayName}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="flex gap-3 mt-6">
                    <button
                        onClick={onClose}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                    >
                        İptal
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading || !plannedDate || !selectedVehicleId}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all font-medium disabled:opacity-50"
                    >
                        {isLoading ? 'Planlanıyor...' : 'Planla'}
                    </button>
                </div>
            </div>
        </div>
    )
}
