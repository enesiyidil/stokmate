import React, { useEffect, useState } from 'react';
import { usePermissions } from '../../hooks/usePermissions';
import axios from 'axios';

interface PendingAction {
    id: string;
    actionType: 'DELETE_VEHICLE' | 'DELETE_STORE' | 'DELETE_CUSTOMER' | 'CANCEL_ORDER';
    entityType: string;
    entityId: string;
    requestedByEmail: string;
    requestedByName: string;
    requestedAt: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    reviewedByEmail?: string;
    reviewedByName?: string;
    reviewedAt?: string;
    reviewNotes?: string;
}

const ACTION_TYPE_LABELS: Record<string, string> = {
    DELETE_VEHICLE: 'Araç Silme',
    DELETE_STORE: 'Mağaza Silme',
    DELETE_CUSTOMER: 'Müşteri Silme',
    CANCEL_ORDER: 'Sipariş İptali'
};

const STATUS_LABELS: Record<string, string> = {
    PENDING: 'Beklemede',
    APPROVED: 'Onaylandı',
    REJECTED: 'Reddedildi'
};

export const EventsPage: React.FC = () => {
    const { canAccessEventsPage, canApproveActions } = usePermissions();
    const [pendingActions, setPendingActions] = useState<PendingAction[]>([]);
    const [allActions, setAllActions] = useState<PendingAction[]>([]);
    const [showAll, setShowAll] = useState(false);
    const [loading, setLoading] = useState(true);
    const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        if (!canAccessEventsPage) {
            window.location.href = '/';
            return;
        }
        loadActions();
    }, [canAccessEventsPage]);

    const loadActions = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');

            // Load pending actions
            const pendingResponse = await axios.get('/api/pending-actions', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPendingActions(Array.isArray(pendingResponse.data) ? pendingResponse.data : []);

            // Load all actions for history
            const allResponse = await axios.get('/api/pending-actions/all', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAllActions(Array.isArray(allResponse.data) ? allResponse.data : []);
        } catch (error) {
            console.error('Failed to load actions:', error);
            setPendingActions([]);
            setAllActions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id: string) => {
        if (!canApproveActions) {
            alert('Bu işlem için yetkiniz yok');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/pending-actions/${id}/approve`,
                { reviewNotes: reviewNotes[id] || '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('İşlem onaylandı');
            loadActions();
            setReviewNotes(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } catch (error) {
            console.error('Failed to approve action:', error);
            alert('Onaylama başarısız');
        }
    };

    const handleReject = async (id: string) => {
        if (!canApproveActions) {
            alert('Bu işlem için yetkiniz yok');
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post(`/api/pending-actions/${id}/reject`,
                { reviewNotes: reviewNotes[id] || '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            alert('İşlemreddedildi');
            loadActions();
            setReviewNotes(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });
        } catch (error) {
            console.error('Failed to reject action:', error);
            alert('Reddetme başarısız');
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('tr-TR');
    };

    const displayActions = showAll ? allActions : pendingActions;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-gray-600">Yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="p-6">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Olaylar ve Onaylar</h1>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowAll(false)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${!showAll
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Bekleyen ({pendingActions.length})
                    </button>
                    <button
                        onClick={() => setShowAll(true)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${showAll
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                    >
                        Tümü ({allActions.length})
                    </button>
                </div>
            </div>

            {displayActions.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
                    {showAll ? 'Henüz hiç işlem yok' : 'Bekleyen işlem yok'}
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    İşlem Tipi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Talep Eden
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Talep Tarihi
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Durum
                                </th>
                                {canApproveActions && !showAll && (
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        İşlemler
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {displayActions.map((action) => (
                                <tr key={action.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">
                                            {ACTION_TYPE_LABELS[action.actionType]}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {action.entityType}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">{action.requestedByName}</div>
                                        <div className="text-sm text-gray-500">{action.requestedByEmail}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(action.requestedAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${action.status === 'PENDING'
                                                ? 'bg-yellow-100 text-yellow-800'
                                                : action.status === 'APPROVED'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {STATUS_LABELS[action.status]}
                                        </span>
                                    </td>
                                    {canApproveActions && action.status === 'PENDING' && !showAll && (
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex gap-2 items-center">
                                                <input
                                                    type="text"
                                                    placeholder="Not (opsiyonel)"
                                                    value={reviewNotes[action.id] || ''}
                                                    onChange={(e) =>
                                                        setReviewNotes(prev => ({ ...prev, [action.id]: e.target.value }))
                                                    }
                                                    className="border rounded px-2 py-1 text-sm"
                                                />
                                                <button
                                                    onClick={() => handleApprove(action.id)}
                                                    className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                                                >
                                                    Onayla
                                                </button>
                                                <button
                                                    onClick={() => handleReject(action.id)}
                                                    className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                                                >
                                                    Reddet
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
