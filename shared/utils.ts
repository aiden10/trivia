import { CREATE_ROOM_ENDPOINT } from './constants';

export interface CreateRoomResponse {
    room_id: string;
}

export async function createRoom(): Promise<CreateRoomResponse> {
    try {
        const response = await fetch(CREATE_ROOM_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({password: ""})
        });

        if (!response.ok) {
            throw new Error(`Failed to create room: ${response.statusText}`);
        }

        return await response.json();
    } 
    catch (error) {
        console.error('Error creating room:', error);
        throw error;
    }
}

export async function playSound(filename: string, volume: number = 1.0) {
    try {
        const response = await fetch(`/sounds/${filename}`);
        if (!response.ok) {
            console.warn(`Sound file not found: ${filename}`);
            return;
        }
        
        const audio = new Audio(`/sounds/${filename}`);
        audio.volume = volume;
        audio.play().catch(e => console.error("Error playing sound:", e));
    } 
    catch (error) {
        console.error(`Error loading sound: ${filename}`, error);
    }
}

export function capitalizeWords(str: string): string {
    return str
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
}

export type ToastOptions = {
    duration?: number;
    type?: 'info' | 'success' | 'error';
    position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
};

export function showToast(message: string, opts: ToastOptions = {}) {
    if (typeof document === 'undefined') return;
    const { duration = 3000, type = 'info', position = 'top-right' } = opts;

    const containerId = `app-toast-container-${position}`;
    let container = document.getElementById(containerId);
    if (!container) {
        container = document.createElement('div');
        container.id = containerId;
        const base = 'position:fixed;z-index:9999;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
        let posStyle = '';
        switch (position) {
            case 'top-left': posStyle = 'top:16px;left:16px;align-items:flex-start;'; break;
            case 'bottom-left': posStyle = 'bottom:16px;left:16px;align-items:flex-start;'; break;
            case 'bottom-right': posStyle = 'bottom:16px;right:16px;align-items:flex-end;'; break;
            default: posStyle = 'top:16px;right:16px;align-items:flex-end;'; break;
        }
        container.style.cssText = base + posStyle;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.setAttribute('role', 'status');

    let bgColor = '';
    let borderColor = '#FFFF';
    switch (type) {
        case 'success':
            bgColor = '#14532d'; // emerald-900
            borderColor = '#10b981';
            break;
        case 'error':
            bgColor = '#450a0a'; // red-950
            break;
        default:
            bgColor = '#171717'; // neutral-900
            break;
    }

    toast.style.cssText = `
        pointer-events: auto;
        min-width: 180px;
        max-width: 340px;
        padding: 12px 16px;
        border: 3px solid ${borderColor};
        background: ${bgColor};
        color: #ecfeff;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
        opacity: 0;
        transform: translateY(-10px);
        transition: opacity 200ms ease, transform 200ms ease;
        font-family: Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        font-size: 15px;
        font-weight: 500;
        line-height: 1.4;
        text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    `;
    toast.textContent = message;

    const close = document.createElement('button');
    close.innerHTML = '×';
    close.style.cssText = `
        margin-left: 12px;
        background: transparent;
        border: 0;
        color: rgba(236, 254, 255, 0.8);
        cursor: pointer;
        font-size: 20px;
        font-weight: bold;
        line-height: 1;
        padding: 0;
        transition: color 150ms ease;
        display: none;
    `;
    close.onmouseenter = () => close.style.color = '#fff';
    close.onmouseleave = () => close.style.color = 'rgba(236, 254, 255, 0.8)';
    close.onclick = () => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => wrapper.remove(), 200);
    };

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
    `;
    wrapper.appendChild(toast);
    wrapper.appendChild(close);

    container.appendChild(wrapper);

    requestAnimationFrame(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    });

    const timeout = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => {
            wrapper.remove();
        }, 220);
    }, duration);

    close.onclick = () => {
        clearTimeout(timeout);
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-10px)';
        setTimeout(() => wrapper.remove(), 200);
    };
}