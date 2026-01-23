import { useCallback } from 'react';

type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

export const useHaptic = () => {
    const trigger = useCallback((type: HapticType = 'light') => {
        if (!navigator.vibrate) return;

        switch (type) {
            case 'light':
                navigator.vibrate(10);
                break;
            case 'medium':
                navigator.vibrate(40);
                break;
            case 'heavy':
                navigator.vibrate(80);
                break;
            case 'success':
                navigator.vibrate([20, 40, 20]);
                break;
            case 'warning':
                navigator.vibrate([30, 50]);
                break;
            case 'error':
                navigator.vibrate([50, 30, 50, 30]);
                break;
            default:
                navigator.vibrate(20);
        }
    }, []);

    const triggerImpact = useCallback((style: 'light' | 'medium' | 'heavy') => {
        trigger(style);
    }, [trigger]);

    const triggerNotification = useCallback((type: 'success' | 'warning' | 'error') => {
        trigger(type);
    }, [trigger]);

    const triggerSelection = useCallback(() => {
        trigger('light');
    }, [trigger]);

    return { trigger, triggerImpact, triggerNotification, triggerSelection };
};
