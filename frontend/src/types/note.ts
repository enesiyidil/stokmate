export type NoteType = 'TEXT' | 'TODO';
export type NotePriority = 'LOW' | 'MEDIUM' | 'HIGH';
export type NoteStatus = 'PENDING' | 'COMPLETED';

export type NoteTag =
    | 'SIPARIS'
    | 'STOKLU_SATIS'
    | 'SEVKIYAT'
    | 'URUN'
    | 'URUN_KABUL'
    | 'BAKIYE_DEFTERI'
    | 'CAPRAZ_DONUSTURME'
    | 'ARACLAR'
    | 'KISISEL'
    | 'MAGAZA'
    | 'GENEL'
    | 'DIGER';

export type LinkedEntityType =
    | 'ORDER'
    | 'PRODUCT'
    | 'CUSTOMER'
    | 'RECEIPT'
    | 'SHIPMENT'
    | 'CROSS_CONVERSION'
    | 'BALANCE'
    | 'SALE'
    | 'VEHICLE'
    | 'STORE'
    | 'NONE';

export interface NoteItem {
    id: number;
    content: string;
    isCompleted: boolean;
    position: number;
}

export interface Note {
    id: string;
    title: string;
    content: string;
    noteType: NoteType;
    priority: NotePriority;
    status: NoteStatus;
    tags: NoteTag[];
    linkedEntityType: LinkedEntityType;
    linkedEntityId: string;
    items: NoteItem[];
    color: string;
    createdDate: string;
    lastModifiedDate: string;
}

export interface PageResponse<T> {
    content: T[];
    pageable: any;
    last: boolean;
    totalElements: number;
    totalPages: number;
    first: boolean;
    size: number;
    number: number;
    sort: any;
    numberOfElements: number;
    empty: boolean;
}
