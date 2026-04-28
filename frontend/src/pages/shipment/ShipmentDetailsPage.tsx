import { ArrowLeft, Package, User, FileText, Calendar, Truck, Activity, Clock, CheckCircle, AlertTriangle, XCircle, RotateCcw, Edit3, Wrench, ExternalLink } from 'lucide-react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useGetShipmentDetailsQuery, useGetShipmentDetailsByIdQuery, usePlanShipmentMutation, useListVehiclesQuery, useDownloadShipmentReportMutation, useDownloadShipmentReportByShipmentIdMutation, useCompleteShipmentMutation, useFinalizeShipmentMutation, useDownloadSignedDocumentMutation, useCancelShipmentMutation, useWithdrawShipmentMutation, useUpdatePlannedDateMutation, useUpdateShipmentVehicleMutation, useUpdateShipmentDriverByIdMutation, useResolveShipmentProblemMutation } from '../../services/shipmentApi'
import { useAddOrderNoteMutation } from '../../services/orderApi'
import { useGetUserSummariesQuery } from '../../services/userApi'
import { useGetOrderActivitiesQuery } from '../../services/orderActivityApi'
import { formatDistanceToNow } from 'date-fns'
import { tr } from 'date-fns/locale'
import { useTopbar } from '../../context/TopbarContext'
import { useEffect, useState, useMemo } from 'react'
import CompleteShipmentModal from '../../components/shipment/CompleteShipmentModal'
import ResolveProblemModal from '../../components/shipment/ResolveProblemModal'
import { useAppSelector } from '../../hooks/useAuth'
import { useToast } from '../../context/ToastContext'
import ConfirmModal from '../../components/common/ConfirmModal'
import ImageGalleryModal from '../../components/common/ImageGalleryModal'
import OtpVerificationModal from '../../components/common/OtpVerificationModal'

export default function ShipmentDetailsPage() {
    const { orderId } = useParams<{ orderId: string }>()
    const navigate = useNavigate()
    const { setTopbarContent } = useTopbar()
    const { user } = useAppSelector((state) => state.auth)
    const [searchParams] = useSearchParams()
    const isShipmentId = searchParams.get('type') === 'SHIPMENT'

    // Permissions
    const canPlan = ['ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role || '')
    const canComplete = ['ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role || '')
    const canFinalize = ['ADMIN', 'MANAGER', 'DIRECTOR'].includes(user?.role || '')
    const canModifyShipment = ['ADMIN', 'MANAGER'].includes(user?.role || '')
    const canResolveProblem = ['ADMIN', 'MANAGER', 'DIRECTOR', 'LOGISTICS_MANAGER', 'OPERATIONS_MANAGER'].includes(user?.role || '')

    // Conditional query based on ID type
    const orderQuery = useGetShipmentDetailsQuery(orderId!, { skip: isShipmentId })
    const shipmentQuery = useGetShipmentDetailsByIdQuery(orderId!, { skip: !isShipmentId })

    const shipmentDetails = isShipmentId ? shipmentQuery.data : orderQuery.data
    const isLoading = isShipmentId ? shipmentQuery.isLoading : orderQuery.isLoading
    const refetch = isShipmentId ? shipmentQuery.refetch : orderQuery.refetch

    // Correctly determine orderId for activities fetching
    const realOrderId = isShipmentId ? shipmentDetails?.orderId : orderId
    const { data: allActivities = [] } = useGetOrderActivitiesQuery(realOrderId!, { skip: !realOrderId })

    // Filter activities by shipment ID if viewing a specific shipment
    const activities = useMemo(() => {
        if (!isShipmentId || !orderId) return allActivities
        const shortId = orderId.substring(0, 8)
        // Show activities that either contain this shipment's ID or are general order activities (no shipment prefix)
        return allActivities.filter(a =>
            a.description?.includes(`[Sevk #${shortId}]`) ||
            (!a.description?.includes('[Sevk #') && a.activityType.includes('SHIPMENT'))
        )
    }, [allActivities, isShipmentId, orderId])

    const { data: vehicles = [] } = useListVehiclesQuery()
    const { data: users = [] } = useGetUserSummariesQuery()
    const [planShipmentMutation, { isLoading: isPlanning }] = usePlanShipmentMutation()
    const [downloadReport] = useDownloadShipmentReportMutation()
    const [downloadReportByShipmentId] = useDownloadShipmentReportByShipmentIdMutation()
    const [downloadSignedDocument, { isLoading: isDownloadingDoc }] = useDownloadSignedDocumentMutation()
    const [completeShipmentMutation, { isLoading: isCompleting }] = useCompleteShipmentMutation()
    const [finalizeShipmentMutation] = useFinalizeShipmentMutation()
    const [cancelShipmentMutation, { isLoading: isCancelling }] = useCancelShipmentMutation()
    const [withdrawShipmentMutation, { isLoading: isWithdrawing }] = useWithdrawShipmentMutation()
    const [updatePlannedDateMutation, { isLoading: isUpdatingDate }] = useUpdatePlannedDateMutation()
    const [updateVehicleMutation, { isLoading: isUpdatingVehicle }] = useUpdateShipmentVehicleMutation()
    const [updateDriverMutation, { isLoading: isUpdatingDriver }] = useUpdateShipmentDriverByIdMutation()
    const [resolveShipmentProblem, { isLoading: isResolvingProblem }] = useResolveShipmentProblemMutation()

    const [showPlanningModal, setShowPlanningModal] = useState(false)
    const [showResolveProblemModal, setShowResolveProblemModal] = useState(false)
    const [showCompleteModal, setShowCompleteModal] = useState(false)
    const [showDocumentModal, setShowDocumentModal] = useState(false)
    const [showGallery, setShowGallery] = useState(false)
    const [showUpdateDateModal, setShowUpdateDateModal] = useState(false)
    const [showVehicleUpdateModal, setShowVehicleUpdateModal] = useState(false)
    const [showDriverUpdateModal, setShowDriverUpdateModal] = useState(false)

    // Form states
    const [plannedDate, setPlannedDate] = useState('')
    const [newPlannedDate, setNewPlannedDate] = useState('')
    const [selectedVehicleId, setSelectedVehicleId] = useState('')
    const [updateVehicleId, setUpdateVehicleId] = useState('')
    const [selectedDriverIdForPlanning, setSelectedDriverIdForPlanning] = useState('')
    const [updateDriverId, setUpdateDriverId] = useState('')
    const [showOtpModal, setShowOtpModal] = useState(false)
    const [pendingOtpAction, setPendingOtpAction] = useState<(() => void) | null>(null)

    const verifyGate = (action: () => void) => {
        if (user?.totpEnabled) {
            setPendingOtpAction(() => action)
            setShowOtpModal(true)
        } else {
            action()
        }
    }
    const [galleryStartIndex, setGalleryStartIndex] = useState(0)
    const [showResolutionGallery, setShowResolutionGallery] = useState(false)
    const [resolutionGalleryStartIndex, setResolutionGalleryStartIndex] = useState(0)
    const [documentUrl, setDocumentUrl] = useState<string | null>(null)
    const [documentType, setDocumentType] = useState<'pdf' | 'image' | null>(null)
    const { success, error } = useToast()
    const [showApproveConfirm, setShowApproveConfirm] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [showWithdrawConfirm, setShowWithdrawConfirm] = useState(false)

    const [addOrderNote, { isLoading: isAddingNote }] = useAddOrderNoteMutation()


    const productsToShip = useMemo(() => {
        return shipmentDetails?.products.filter(p => p.pendingQuantity > 0) || []
    }, [shipmentDetails])

    const otherProducts = useMemo(() => {
        return shipmentDetails?.products.filter(p => p.pendingQuantity <= 0) || []
    }, [shipmentDetails])

    useEffect(() => {
        if (shipmentDetails) {
            const statusBadge = getStatusBadge()
            const StatusIcon = statusBadge.icon

            setTopbarContent({
                title: shipmentDetails.orderNo || 'Detay',
                description: 'Sevk Detayı',
                icon: <Truck className="w-8 h-8" />,
                showFiltersInTopbar: true,
                actions: (
                    <div className="flex items-center gap-3">
                        <span className={`px - 3 py - 1 rounded - lg text - sm font - medium border flex items - center gap - 2 ${statusBadge.className} `}>
                            <StatusIcon className="w-4 h-4" />
                            {statusBadge.label}
                        </span>
                        {shipmentDetails.shipmentStatus === 'PLANNED' && canComplete && (
                            <button
                                onClick={() => setShowCompleteModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all text-xs font-medium"
                            >
                                <CheckCircle className="w-4 h-4" />
                                <span className="hidden lg:inline">Sevk Tamamla</span>
                            </button>
                        )}
                        {shipmentDetails.shipmentStatus === 'APPROVED' && canPlan && (
                            <button
                                onClick={() => setShowPlanningModal(true)}
                                className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-lg hover:from-orange-600 hover:to-amber-700 transition-all"
                            >
                                <Calendar className="w-4 h-4" />
                                <span className="hidden lg:inline">Sevk Planla</span>
                            </button>
                        )}
                    </div>
                ),
                filters: (
                    <button onClick={() => navigate('/shipment')} className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Geri
                    </button>
                )
            })

            if (shipmentDetails.plannedShipmentDate) {
                setPlannedDate(new Date(shipmentDetails.plannedShipmentDate).toISOString().slice(0, 10))
            }
            if (shipmentDetails.vehicle) {
                setSelectedVehicleId(shipmentDetails.vehicle.id)
            }
        }

        return () => setTopbarContent(null)
    }, [shipmentDetails, setTopbarContent, navigate])

    const getStatusBadge = () => {
        const status = shipmentDetails?.shipmentStatus || ''
        if (status === 'FINALIZED') {
            return { label: 'Tamamlandı (Onaylandı)', icon: CheckCircle, className: 'bg-green-500/30 text-white border-green-400/30' }
        }
        if (status === 'COMPLETED') {
            return { label: 'Teslimat Yapıldı (Onay Bekliyor)', icon: CheckCircle, className: 'bg-blue-500/30 text-white border-blue-400/30' }
        }
        if (status === 'PLANNED') {
            return { label: 'Sevke Hazır', icon: Truck, className: 'bg-indigo-500/30 text-white border-indigo-400/30' }
        }
        if (status === 'APPROVED') {
            return { label: 'Planlama Bekliyor', icon: Clock, className: 'bg-orange-500/30 text-white border-orange-400/30' }
        }
        if (status === 'PENDING') {
            return { label: 'Onay Bekliyor', icon: Clock, className: 'bg-yellow-500/30 text-white border-yellow-400/30' }
        }
        return { label: 'Beklemede', icon: Clock, className: 'bg-gray-500/30 text-white border-gray-400/30' }
    }

    const handlePlanShipment = async () => {
        if (!plannedDate || !selectedVehicleId) {
            error('Lütfen tarih ve araç seçiniz')
            return
        }

        verifyGate(async () => {
            try {
                await planShipmentMutation({
                    orderId: orderId!,
                    data: {
                        plannedDate: new Date(plannedDate).toISOString(),
                        vehicleId: selectedVehicleId,
                        driverId: selectedDriverIdForPlanning || undefined
                    }
                }).unwrap()
                success('Sevk başarıyla planlandı!')
                setShowPlanningModal(false)
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleCompleteShipment = async (data: {
        deliveryStatus: 'PROBLEM_FREE' | 'PROBLEMATIC'
        problemType?: 'FACTORY_DEFECT' | 'TRANSPORT_ASSEMBLY_DEFECT'
        notes?: string
        deliveryPhotos: File[]
        signedDocument: File | null
    }) => {
        if (!shipmentDetails) return

        try {
            const formData = new FormData()

            // Use shipmentId from response if available, otherwise use orderId
            const shipmentIdToUse = shipmentDetails.shipmentId || orderId!
            formData.append('shipmentId', shipmentIdToUse)
            formData.append('deliveryStatus', data.deliveryStatus)

            if (data.problemType) {
                formData.append('problemType', data.problemType)
            }
            if (data.notes) {
                formData.append('deliveryNotes', data.notes)
            }

            // Add delivery photos
            data.deliveryPhotos.forEach((photo) => {
                formData.append('deliveryPhotos', photo)
            })

            // Add signed document
            if (data.signedDocument) {
                formData.append('signedDocument', data.signedDocument)
            }

            verifyGate(async () => {
                try {
                    await completeShipmentMutation(formData).unwrap()
                    success('Sevk başarıyla tamamlandı! Onay bekliyor.')
                    setShowCompleteModal(false)
                    refetch() // Refresh page data
                } catch (err: any) {
                    error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
                }
            })
        } catch (err: any) {
            error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
        }
    }

    const handleConfirmApprove = async () => {
        if (!shipmentDetails?.shipmentId) return

        verifyGate(async () => {
            try {
                await finalizeShipmentMutation(shipmentDetails.shipmentId!).unwrap()
                success('Sevk başarıyla onaylandı!')
                setShowApproveConfirm(false)
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    // ======== ADMIN/MANAGER SHIPMENT MANAGEMENT HANDLERS ========

    const handleCancelShipment = async () => {
        if (!shipmentDetails?.shipmentId) return

        verifyGate(async () => {
            try {
                await cancelShipmentMutation(shipmentDetails.shipmentId!).unwrap()
                success('Sevkiyat başarıyla iptal edildi!')
                setShowCancelConfirm(false)
                navigate('/shipment')
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleWithdrawShipment = async () => {
        if (!shipmentDetails?.shipmentId) return

        verifyGate(async () => {
            try {
                await withdrawShipmentMutation(shipmentDetails.shipmentId!).unwrap()
                success('Sevkiyat talebi geri çekildi!')
                setShowWithdrawConfirm(false)
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleUpdatePlannedDate = async () => {
        if (!shipmentDetails?.shipmentId || !newPlannedDate) return

        verifyGate(async () => {
            try {
                await updatePlannedDateMutation({
                    shipmentId: shipmentDetails.shipmentId!,
                    newDate: new Date(newPlannedDate).toISOString()
                }).unwrap()
                success('Planlanan tarih güncellendi!')
                setShowUpdateDateModal(false)
                setNewPlannedDate('')
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleUpdateVehicle = async () => {
        if (!shipmentDetails?.shipmentId || !updateVehicleId) return

        verifyGate(async () => {
            try {
                await updateVehicleMutation({
                    shipmentId: shipmentDetails.shipmentId!,
                    vehicleId: updateVehicleId
                }).unwrap()
                success('Araç bilgisi güncellendi!')
                setShowVehicleUpdateModal(false)
                setUpdateVehicleId('')
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleUpdateDriver = async () => {
        if (!shipmentDetails?.shipmentId || !updateDriverId) return

        verifyGate(async () => {
            try {
                await updateDriverMutation({
                    shipmentId: shipmentDetails.shipmentId!,
                    driverId: updateDriverId
                }).unwrap()
                success('Sürücü bilgisi güncellendi!')
                setShowDriverUpdateModal(false)
                setUpdateDriverId('')
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }



    const handleDownloadReport = async () => {
        // For sale shipments, use shipmentId; for order shipments, use orderId
        const isSaleShipment = shipmentDetails?.shipmentType === 'SALE' || !realOrderId

        try {
            let blob: Blob
            if (isSaleShipment && shipmentDetails?.shipmentId) {
                blob = await downloadReportByShipmentId(shipmentDetails.shipmentId).unwrap()
            } else {
                const orderIdForReport = realOrderId || orderId!
                blob = await downloadReport(orderIdForReport).unwrap()
            }

            const url = window.URL.createObjectURL(blob)

            // Open PDF in new window and trigger print dialog
            const printWindow = window.open(url, '_blank')
            if (printWindow) {
                printWindow.onload = () => {
                    printWindow.print()
                    // Clean up URL after print dialog closes
                    setTimeout(() => window.URL.revokeObjectURL(url), 100)
                }
            } else {
                // Fallback if popup blocked - download instead
                const link = document.createElement('a')
                link.href = url
                link.download = `sevk-raporu-${shipmentDetails?.orderNo || shipmentDetails?.saleNo || 'belge'}.pdf`
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                window.URL.revokeObjectURL(url)
            }
        } catch (err: any) {
            error('Hata: ' + (err.data?.message || err.message || 'Rapor oluşturulamadı'))
        }
    }

    const handleViewDocument = async () => {
        if (!shipmentDetails?.shipmentId) return

        try {
            const blob = await downloadSignedDocument(shipmentDetails.shipmentId).unwrap()
            const url = window.URL.createObjectURL(blob)
            setDocumentUrl(url)

            // Guess type from url or signedDocumentUrl if possible, or just blob type
            if (blob.type === 'application/pdf') {
                setDocumentType('pdf')
            } else {
                setDocumentType('image')
            }

            setShowDocumentModal(true)
        } catch (err: any) {
            error('Belge yüklenirken hata oluştu: ' + (err.data?.message || 'Erişim hatası veya dosya bulunamadı'))
        }
    }

    const closeDocumentModal = () => {
        setShowDocumentModal(false)
        if (documentUrl) {
            window.URL.revokeObjectURL(documentUrl)
            setDocumentUrl(null)
        }
        setDocumentType(null)
    }

    const handleResolveProblem = async (data: { description: string; photos: File[] }) => {
        if (!shipmentDetails?.shipmentId) return

        const formData = new FormData()
        formData.append('description', data.description)
        data.photos.forEach((photo) => {
            formData.append('photos', photo)
        })

        verifyGate(async () => {
            try {
                await resolveShipmentProblem({
                    shipmentId: shipmentDetails.shipmentId!,
                    formData
                }).unwrap()
                success('Sorun başarıyla çözüldü olarak işaretlendi!')
                setShowResolveProblemModal(false)
                refetch()
            } catch (err: any) {
                error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
            }
        })
    }

    const handleReportMissingInfo = async () => {
        if (!realOrderId) return

        const missingFields: string[] = []
        if (!shipmentDetails?.customer?.phone) missingFields.push('Telefon numarası')
        if (!shipmentDetails?.customer?.address) missingFields.push('Adres bilgisi')

        if (missingFields.length === 0) {
            success('Tüm müşteri bilgileri mevcut.')
            return
        }

        const noteContent = `⚠️ UYARI: Bu siparişte eksik müşteri bilgileri bulunmaktadır.Eksik alanlar: ${missingFields.join(', ')}. Sevk planlaması yapılabilmesi için lütfen bu bilgileri güncelleyiniz.`

        try {
            await addOrderNote({ orderId: realOrderId, content: noteContent }).unwrap()
            success('Eksik bilgi notu siparişe başarıyla eklendi. İlgili kişiler bilgilendirildi.')
        } catch (err: any) {
            error('Hata: ' + (err.data?.message || err.message || 'Bir hata oluştu'))
        }
    }

    // Check if customer info is missing
    const hasCustomerInfoMissing = !shipmentDetails?.customer?.phone || !shipmentDetails?.customer?.address

    if (isLoading || !shipmentDetails) {
        return <div className="flex items-center justify-center min-h-screen"><p className="text-white text-xl">Yükleniyor...</p></div>
    }

    const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString('tr-TR')

    return (
        <div className="min-h-screen">
            <div className="p-6 space-y-6">
                <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div><p className="text-xs text-amber-700 mb-1">Sözleşme No</p><p className="text-amber-900 font-medium">{shipmentDetails.contractNo || '-'}</p></div>
                        <div><p className="text-xs text-amber-700 mb-1">Sipariş/Satış Tarihi</p><p className="text-amber-900 font-medium">{formatDate(shipmentDetails.orderDate)}</p></div>
                        <div><p className="text-xs text-amber-700 mb-1">Planlanan Sevk</p><p className="text-amber-900 font-medium">{shipmentDetails.plannedShipmentDate ? formatDate(shipmentDetails.plannedShipmentDate) : 'Henüz Planlanmadı'}</p></div>
                        <div><p className="text-xs text-amber-700 mb-1">Şoför</p><p className="text-amber-900 font-medium">{shipmentDetails.driver?.name || 'Atanmamış'}</p></div>
                        <div><p className="text-xs text-amber-700 mb-1">Araç</p><p className="text-amber-900 font-medium">{shipmentDetails.vehicle ? `${shipmentDetails.vehicle.licensePlate} (${shipmentDetails.vehicle.vehicleType})` : 'Atanmamış'}</p></div>
                        {shipmentDetails.shipmentNote && (
                            <div className="col-span-1 md:col-span-2 lg:col-span-5 pt-2 border-t border-amber-100 mt-1">
                                <p className="text-xs text-amber-700 mb-1 font-semibold">Sevkiyat Notu</p>
                                <p className="text-amber-900 text-sm whitespace-pre-wrap bg-amber-50 p-2 rounded-lg border border-amber-100">{shipmentDetails.shipmentNote}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 space-y-6">
                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2"><User className="w-5 h-5" />Müşteri Bilgileri</h3>
                            <div className="space-y-3">
                                <div><p className="text-xs text-amber-700">Ad Soyad</p><p className="text-amber-900 font-medium">{shipmentDetails.customer.name}</p></div>
                                {shipmentDetails.customer.phone && (<div><p className="text-xs text-amber-700">Telefon</p><p className="text-amber-900">{shipmentDetails.customer.phone}</p></div>)}
                                {shipmentDetails.salesConsultant && (<div><p className="text-xs text-amber-700">Satış Danışmanı</p><p className="text-amber-900">{shipmentDetails.salesConsultant.name}</p></div>)}
                                {shipmentDetails.customer.address && (<div><p className="text-xs text-amber-700">Adres</p><p className="text-amber-900 text-sm">{shipmentDetails.customer.address}</p></div>)}
                            </div>
                            {hasCustomerInfoMissing && (
                                <button
                                    onClick={handleReportMissingInfo}
                                    disabled={isAddingNote}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-400 text-sm font-medium disabled:opacity-50"
                                >
                                    <AlertTriangle className="w-4 h-4" />
                                    {isAddingNote ? 'Bildirim Gönderiliyor...' : 'Eksik Bilgi Bildir'}
                                </button>
                            )}
                        </div>

                        {otherProducts.length > 0 && (
                            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4"><Package className="w-5 h-5" />Diğer Ürünler ({otherProducts.length})</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                                    {otherProducts.map((product, idx) => (
                                        <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                            <p className="text-xs text-amber-700 mb-1">Ürün</p>
                                            <p className="text-amber-900 font-medium text-sm">{product.productName}</p>
                                            <div className="grid grid-cols-2 gap-2 mt-2">
                                                <div><p className="text-xs text-amber-700">Sevk Edilen</p><p className="text-green-700 font-semibold text-sm">{product.shippedQuantity}</p></div>
                                                <div><p className="text-xs text-amber-700">Toplam</p><p className="text-amber-900 text-sm">{product.totalQuantity}</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}


                        {/* Completion Info - Show when COMPLETED, APPROVED, or FINALIZED */}
                        {(shipmentDetails.shipmentStatus === 'COMPLETED' || shipmentDetails.shipmentStatus === 'APPROVED' || shipmentDetails.shipmentStatus === 'FINALIZED') && (
                            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2">
                                        <Package className="w-5 h-5" />
                                        Teslim Bilgileri
                                    </h3>
                                    {shipmentDetails.shipmentStatus === 'COMPLETED' && canFinalize && (
                                        <button
                                            onClick={() => setShowApproveConfirm(true)}
                                            className="px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all shadow-md"
                                        >
                                            Sevk Onayla
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-3">
                                    {shipmentDetails.deliveryStatus && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-1">Durum</p>
                                            <p className={`font - semibold ${shipmentDetails.deliveryStatus === 'PROBLEM_FREE' ? 'text-green-700' : 'text-red-700'} `}>
                                                {shipmentDetails.deliveryStatus === 'PROBLEM_FREE' ? '✓ Sorunsuz Teslimat' : '⚠ Sorunlu Teslimat'}
                                            </p>
                                        </div>
                                    )}

                                    {shipmentDetails.problemType && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-1">Sorun Tipi</p>
                                            <p className="text-amber-900 font-medium">
                                                {shipmentDetails.problemType === 'FACTORY_DEFECT' ? 'Fabrika Hatası' : 'Teslimat/Montaj Hatası'}
                                            </p>
                                        </div>
                                    )}

                                    {/* Problem Resolution Status */}
                                    {shipmentDetails.deliveryStatus === 'PROBLEMATIC' && (
                                        <div className="pt-2 border-t border-amber-100">
                                            {shipmentDetails.problemResolved ? (
                                                <div className="p-3 bg-green-50 border border-green-200 rounded-lg space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <CheckCircle className="w-4 h-4 text-green-600" />
                                                        <p className="text-green-800 font-semibold text-sm">Sorun Çözüldü</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-green-700 mb-0.5">Çözüm Yöntemi</p>
                                                        <p className="text-green-900 text-sm font-medium">
                                                            {shipmentDetails.resolutionType === 'MANUAL' ? 'Manuel Çözüm' : 'SSH Siparişi ile Çözüm'}
                                                        </p>
                                                    </div>
                                                    {shipmentDetails.resolutionDescription && (
                                                        <div>
                                                            <p className="text-xs text-green-700 mb-0.5">Açıklama</p>
                                                            <p className="text-green-900 text-sm whitespace-pre-wrap">{shipmentDetails.resolutionDescription}</p>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <p className="text-xs text-green-700 mb-0.5">Çözen</p>
                                                        <p className="text-green-900 text-sm">
                                                            {shipmentDetails.resolvedByName || (shipmentDetails.resolutionType === 'SSH_ORDER' ? 'Sistem (Otomatik)' : '-')}
                                                        </p>
                                                    </div>
                                                    {shipmentDetails.resolvedAt && (
                                                        <div>
                                                            <p className="text-xs text-green-700 mb-0.5">Çözüm Tarihi</p>
                                                            <p className="text-green-900 text-sm">{new Date(shipmentDetails.resolvedAt).toLocaleDateString('tr-TR')} - {new Date(shipmentDetails.resolvedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                                                        </div>
                                                    )}
                                                    {/* SSH Order Link */}
                                                    {shipmentDetails.resolutionType === 'SSH_ORDER' && shipmentDetails.linkedSshOrderNo && (
                                                        <div>
                                                            <p className="text-xs text-green-700 mb-0.5">SSH Siparişi</p>
                                                            <button
                                                                onClick={() => navigate(`/orders/${shipmentDetails.linkedSshOrderId}`)}
                                                                className="flex items-center gap-1 text-green-700 hover:text-green-900 text-sm font-medium underline"
                                                            >
                                                                {shipmentDetails.linkedSshOrderNo}
                                                                <ExternalLink className="w-3 h-3" />
                                                            </button>
                                                            <p className="text-xs text-green-600 mt-0.5">Durum: {shipmentDetails.linkedSshOrderStatus}</p>
                                                        </div>
                                                    )}
                                                    {/* Resolution Photos */}
                                                    {shipmentDetails.resolutionPhotoUrls && shipmentDetails.resolutionPhotoUrls.length > 0 && (
                                                        <div>
                                                            <p className="text-xs text-green-700 mb-1">Çözüm Fotoğrafları ({shipmentDetails.resolutionPhotoUrls.length})</p>
                                                            <div className="grid grid-cols-3 gap-2">
                                                                {shipmentDetails.resolutionPhotoUrls.map((url, idx) => (
                                                                    <div
                                                                        key={idx}
                                                                        onClick={() => {
                                                                            setResolutionGalleryStartIndex(idx)
                                                                            setShowResolutionGallery(true)
                                                                        }}
                                                                        className="aspect-square rounded-lg overflow-hidden border-2 border-green-300 hover:border-green-500 transition-colors cursor-pointer"
                                                                    >
                                                                        <img
                                                                            src={`/api/files/view?path=${encodeURIComponent(url)}`}
                                                                            alt={`Çözüm ${idx + 1}`}
                                                                            className="w-full h-full object-cover"
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ) : canResolveProblem ? (
                                                <button
                                                    onClick={() => setShowResolveProblemModal(true)}
                                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-md font-medium"
                                                >
                                                    <Wrench className="w-4 h-4" />
                                                    Sorun Gider
                                                </button>
                                            ) : (
                                                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                                    <p className="text-red-700 text-sm font-medium flex items-center gap-2">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        Sorun henüz çözülmedi
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {shipmentDetails.deliveryNotes && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-1">Notlar</p>
                                            <p className="text-amber-900">{shipmentDetails.deliveryNotes}</p>
                                        </div>
                                    )}

                                    {shipmentDetails.deliveryPhotoUrls && shipmentDetails.deliveryPhotoUrls.length > 0 && (
                                        <div>
                                            <p className="text-xs text-amber-700 mb-2">Teslimat Fotoğrafları ({shipmentDetails.deliveryPhotoUrls.length})</p>
                                            <div className="grid grid-cols-3 gap-2">
                                                {shipmentDetails.deliveryPhotoUrls.map((url, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setGalleryStartIndex(idx)
                                                            setShowGallery(true)
                                                        }}
                                                        className="aspect-square rounded-lg overflow-hidden border-2 border-amber-300 hover:border-amber-500 transition-colors cursor-pointer"
                                                    >
                                                        <img
                                                            src={`/api/files/view?path=${encodeURIComponent(url)}`}
                                                            alt={`Teslimat ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6 space-y-4">
                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2"><FileText className="w-5 h-5" />Teslim Tutanağı</h3>
                            {shipmentDetails.signedDocumentUrl ? (
                                <div>
                                    <p className="text-sm text-amber-700 mb-3">Yüklenen tutanak</p>
                                    <button
                                        onClick={handleViewDocument}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-100 text-green-900 rounded-lg hover:bg-green-200 transition-colors border border-green-400"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Tutanağı Görüntüle {isDownloadingDoc && '(Yükleniyor...)'}
                                    </button>
                                </div>
                            ) : shipmentDetails.plannedShipmentDate ? (
                                <div><p className="text-sm text-amber-700 mb-3">Rapor hazır</p><button onClick={handleDownloadReport} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-100 text-purple-900 rounded-lg hover:bg-purple-200 transition-colors border border-purple-400"><FileText className="w-4 h-4" />Raporu Yazdır</button></div>
                            ) : (
                                <p className="text-sm text-amber-700">Sevk planlandıktan sonra rapor hazırlanacak</p>
                            )}
                        </div>

                        {/* Admin/Manager Shipment Management Panel */}
                        {canModifyShipment && shipmentDetails.shipmentStatus !== 'FINALIZED' && (
                            <div className="backdrop-blur-xl bg-white border border-red-200 rounded-2xl shadow-2xl p-6 space-y-4">
                                <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                                    <XCircle className="w-5 h-5" />
                                    Yönetim İşlemleri
                                </h3>
                                <p className="text-xs text-red-700 mb-3">Bu işlemler sadece Admin ve Manager rollerine özeldir.</p>
                                <div className="space-y-3">
                                    {/* Update Date Button - Show if planned */}
                                    {(shipmentDetails.shipmentStatus === 'PLANNED' || shipmentDetails.shipmentStatus === 'APPROVED') && (
                                        <button
                                            onClick={() => {
                                                setNewPlannedDate(shipmentDetails.plannedShipmentDate ? new Date(shipmentDetails.plannedShipmentDate).toISOString().slice(0, 10) : '')
                                                setShowUpdateDateModal(true)
                                            }}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-100 text-amber-900 rounded-lg hover:bg-amber-200 transition-colors border border-amber-400 font-medium"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                            Planlanan Tarihi Değiştir
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <button onClick={() => { setUpdateVehicleId(shipmentDetails.vehicle?.id || ''); setShowVehicleUpdateModal(true) }} className="w-full px-4 py-3 bg-white border-2 border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 font-medium transition-colors flex items-center justify-center gap-2">
                                            <Truck className="w-5 h-5" />
                                            Araç Değiştir
                                        </button>
                                        <button onClick={() => { setUpdateDriverId(shipmentDetails.driver?.id || ''); setShowDriverUpdateModal(true) }} className="w-full px-4 py-3 bg-white border-2 border-amber-300 text-amber-800 rounded-lg hover:bg-amber-50 font-medium transition-colors flex items-center justify-center gap-2">
                                            <User className="w-5 h-5" />
                                            Şoför Değiştir
                                        </button>
                                    </div>

                                    {/* Withdraw Button - Show for PENDING or APPROVED shipments */}
                                    {(shipmentDetails.shipmentStatus === 'PENDING' || shipmentDetails.shipmentStatus === 'APPROVED') && (
                                        <button
                                            onClick={() => setShowWithdrawConfirm(true)}
                                            disabled={isWithdrawing}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-yellow-100 text-yellow-900 rounded-lg hover:bg-yellow-200 transition-colors border border-yellow-400 font-medium disabled:opacity-50"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            {isWithdrawing ? 'Geri Çekiliyor...' : 'Sevkiyat Talebini Geri Çek'}
                                        </button>
                                    )}

                                    {/* Cancel Button - Show for non-finalized shipments */}
                                    {shipmentDetails.shipmentStatus !== 'CANCELLED' && (
                                        <button
                                            onClick={() => setShowCancelConfirm(true)}
                                            disabled={isCancelling}
                                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-900 rounded-lg hover:bg-red-200 transition-colors border border-red-400 font-medium disabled:opacity-50"
                                        >
                                            <XCircle className="w-4 h-4" />
                                            {isCancelling ? 'İptal Ediliyor...' : 'Sevkiyatı İptal Et'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>


                    <div className="lg:col-span-8 space-y-6">
                        {productsToShip.length > 0 && (
                            <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">
                                <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4"><Package className="w-5 h-5" />Sevkteki Ürünler ({productsToShip.length})</h3>
                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                    {productsToShip.map((product, idx) => (
                                        <div key={idx} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div><p className="text-xs text-green-700">Ürün Kodu</p><p className="text-green-900 font-mono text-sm">{product.productCode}</p></div>
                                                <div><p className="text-xs text-green-700">Ürün Adı</p><p className="text-green-900">{product.productName}</p></div>
                                                <div><p className="text-xs text-green-700">Sevk Edilecek</p><p className="text-green-900 font-bold text-lg">{product.pendingQuantity}</p></div>
                                                <div><p className="text-xs text-green-700">Toplam/Kalan</p><p className="text-green-900">{product.totalQuantity} / {product.remainingQuantity}</p></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="backdrop-blur-xl bg-white border border-amber-200 rounded-2xl shadow-2xl p-6">

                            <h3 className="text-lg font-semibold text-amber-900 flex items-center gap-2 mb-4"><Activity className="w-5 h-5" />Sevk Olayları ({activities.filter(a => a.activityType.includes('SHIPMENT')).length})</h3>
                            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                {activities.filter(a => a.activityType.includes('SHIPMENT')).length > 0 ? (
                                    activities.filter(a => a.activityType.includes('SHIPMENT')).map((activity, index) => (
                                        <div key={activity.id} className="relative pl-6">
                                            {index !== activities.length - 1 && <div className="absolute left-2 top-8 bottom-0 w-0.5 bg-gradient-to-b from-amber-400 to-transparent" />}
                                            <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-amber-600 border-2 border-white" />
                                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex-1">
                                                        <p className="text-amber-900 font-medium text-sm">{activity.description}</p>
                                                        <div className="flex items-center gap-3 mt-1 text-xs text-amber-700">
                                                            <span className="flex items-center gap-1"><User className="w-3 h-3" />{activity.userFullName || activity.userEmail}</span>
                                                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: tr })} · {new Date(activity.createdAt).toLocaleDateString('tr-TR')} - {new Date(activity.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                    <span className="text-xs text-purple-400 font-mono">{activity.activityType.replace(/_/g, ' ')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-center text-amber-700 py-8">Henüz aktivite bulunmuyor</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Modal */}
            {
                showDocumentModal && documentUrl && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={closeDocumentModal}>
                        <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col relative" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                <h3 className="font-semibold text-lg text-gray-800">Teslim Tutanağı</h3>
                                <button onClick={closeDocumentModal} className="text-gray-500 hover:text-gray-700 p-2">✕</button>
                            </div>
                            <div className="flex-1 bg-gray-100 overflow-auto flex items-center justify-center p-4">
                                {documentType === 'pdf' ? (
                                    <iframe src={documentUrl} className="w-full h-[70vh]" title="Document Viewer" />
                                ) : (
                                    <img src={documentUrl} alt="Document" className="max-w-full max-h-[70vh] object-contain shadow-lg" />
                                )}
                            </div>
                            <div className="p-4 border-t flex justify-end gap-3 bg-white">
                                <a href={documentUrl} download="teslim-tutanagi" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">İndir</a>
                                <button onClick={closeDocumentModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Kapat</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showPlanningModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-green-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-green-900 mb-4">Sevk Planlama</h3>
                            <div className="space-y-4">
                                <div><label className="block text-sm font-medium text-green-900 mb-2">Planlanan Sevk Tarihi</label><input type="date" value={plannedDate} onChange={(e) => setPlannedDate(e.target.value)} className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500" /></div>
                                <div><label className="block text-sm font-medium text-green-900 mb-2">Araç Seçimi</label><select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)} className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"><option value="">Araç Seçiniz</option>{vehicles.map((vehicle) => (<option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate} - {vehicle.vehicleType}</option>))}</select></div>
                                <div><label className="block text-sm font-medium text-green-900 mb-2">Şoför Seçimi</label><select value={selectedDriverIdForPlanning} onChange={(e) => setSelectedDriverIdForPlanning(e.target.value)} className="w-full px-4 py-3 bg-white border border-green-300 rounded-lg text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"><option value="">Otomatik Ata (Giriş Yapan Kullanıcı)</option>{users.map((user: any) => (<option key={user.id} value={user.id}>{user.firstName} {user.lastName}</option>))}</select></div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button onClick={() => setShowPlanningModal(false)} disabled={isPlanning} className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50">İptal</button>
                                <button onClick={handlePlanShipment} disabled={isPlanning || !plannedDate || !selectedVehicleId} className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-lg hover:from-green-700 hover:to-emerald-800 transition-all font-medium disabled:opacity-50">{isPlanning ? 'Planlanıyor...' : 'Planla'}</button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ImageGalleryModal
                isOpen={showGallery}
                onClose={() => setShowGallery(false)}
                images={shipmentDetails?.deliveryPhotoUrls || []}
                initialIndex={galleryStartIndex}
            />

            <CompleteShipmentModal
                isOpen={showCompleteModal}
                onClose={() => setShowCompleteModal(false)}
                onComplete={handleCompleteShipment}
                isLoading={isCompleting}
            />

            {/* Success Modal removed in favor of Toast */}

            <ConfirmModal
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onCancel={() => setShowApproveConfirm(false)}
                onConfirm={handleConfirmApprove}
                title="Sevki Onayla"
                message="Bu sevkiyatı onaylamak istediğinizden emin misiniz? Stoklar kalıcı olarak düşülecektir."
                confirmText="Onayla"
                cancelText="İptal"
                type="success"
            />

            {/* Cancel Shipment Confirm Modal */}
            <ConfirmModal
                isOpen={showCancelConfirm}
                onClose={() => setShowCancelConfirm(false)}
                onCancel={() => setShowCancelConfirm(false)}
                onConfirm={handleCancelShipment}
                title="Sevkiyatı İptal Et"
                message="Bu sevkiyatı iptal etmek istediğinizden emin misiniz? Sevk edilen miktarlar geri alınacak ve sipariş/satış durumu güncellenecektir."
                confirmText={isCancelling ? 'İptal Ediliyor...' : 'İptal Et'}
                cancelText="Vazgeç"
                type="danger"
            />

            {/* Withdraw Shipment Confirm Modal */}
            <ConfirmModal
                isOpen={showWithdrawConfirm}
                onClose={() => setShowWithdrawConfirm(false)}
                onCancel={() => setShowWithdrawConfirm(false)}
                onConfirm={handleWithdrawShipment}
                title="Sevkiyat Talebini Geri Çek"
                message="Bu sevkiyat talebini geri çekmek istediğinizden emin misiniz? Sevkiyat bekleyen listeden kaldırılacaktır."
                confirmText={isWithdrawing ? 'Geri Çekiliyor...' : 'Geri Çek'}
                cancelText="Vazgeç"
                type="warning"
            />

            {/* Update Planned Date Modal */}
            {
                showUpdateDateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-amber-900 mb-4 flex items-center gap-2">
                                <Edit3 className="w-5 h-5" />
                                Planlanan Tarihi Değiştir
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-amber-900 mb-2">Mevcut Tarih</label>
                                    <p className="text-amber-700">{shipmentDetails?.plannedShipmentDate ? formatDate(shipmentDetails.plannedShipmentDate) : 'Henüz planlanmadı'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-amber-900 mb-2">Yeni Tarih</label>
                                    <input
                                        type="date"
                                        value={newPlannedDate}
                                        onChange={(e) => setNewPlannedDate(e.target.value)}
                                        className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                                    />
                                </div>
                                <p className="text-xs text-amber-600">Not: Admin/Manager geçmiş tarih de seçebilir.</p>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowUpdateDateModal(false)}
                                    disabled={isUpdatingDate}
                                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium disabled:opacity-50"
                                >
                                    İptal
                                </button>
                                <button
                                    onClick={handleUpdatePlannedDate}
                                    disabled={isUpdatingDate || !newPlannedDate}
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-amber-600 to-orange-600 text-white rounded-lg hover:from-amber-700 hover:to-orange-700 transition-all font-medium disabled:opacity-50"
                                >
                                    {isUpdatingDate ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showVehicleUpdateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-amber-900 mb-4">Araç Değiştir</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-amber-900 mb-2">Yeni Araç Seçimi</label>
                                <select value={updateVehicleId} onChange={(e) => setUpdateVehicleId(e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    <option value="">Araç Seçiniz</option>
                                    {vehicles.map((vehicle) => (
                                        <option key={vehicle.id} value={vehicle.id}>{vehicle.licensePlate} - {vehicle.vehicleType}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowVehicleUpdateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">İptal</button>
                                <button onClick={handleUpdateVehicle} disabled={!updateVehicleId || isUpdatingVehicle} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium">
                                    {isUpdatingVehicle ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showDriverUpdateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white border border-amber-200 rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h3 className="text-xl font-bold text-amber-900 mb-4">Şoför Değiştir</h3>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-amber-900 mb-2">Yeni Şoför Seçimi</label>
                                <select value={updateDriverId} onChange={(e) => setUpdateDriverId(e.target.value)} className="w-full px-4 py-3 bg-white border border-amber-300 rounded-lg text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500">
                                    <option value="">Şoför Seçiniz</option>
                                    {users.map((user: any) => (
                                        <option key={user.id} value={user.id}>{user.firstName} {user.lastName} ({user.role})</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button onClick={() => setShowDriverUpdateModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg">İptal</button>
                                <button onClick={handleUpdateDriver} disabled={!updateDriverId || isUpdatingDriver} className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 font-medium">
                                    {isUpdatingDriver ? 'Güncelleniyor...' : 'Güncelle'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <ResolveProblemModal
                isOpen={showResolveProblemModal}
                onClose={() => setShowResolveProblemModal(false)}
                onResolve={handleResolveProblem}
                isLoading={isResolvingProblem}
            />

            <ImageGalleryModal
                isOpen={showResolutionGallery}
                onClose={() => setShowResolutionGallery(false)}
                images={shipmentDetails?.resolutionPhotoUrls || []}
                initialIndex={resolutionGalleryStartIndex}
            />

            <OtpVerificationModal
                isOpen={showOtpModal}
                onClose={() => {
                    setShowOtpModal(false)
                    setPendingOtpAction(null)
                }}
                onVerify={() => {
                    setShowOtpModal(false)
                    if (pendingOtpAction) {
                        pendingOtpAction()
                        setPendingOtpAction(null)
                    }
                }}
            />
        </div >
    )
}
