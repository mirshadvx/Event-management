import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import api from '@/services/api';

export const useSubscriptionStatus = () => {
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useSelector((state) => state.user);

    useEffect(() => {
        const fetchSubscription = async () => {
            if (!user) {
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await api.get('/users/subscription-details/');
                
                if (response.data.success) {
                    setSubscription(response.data.subscription);
                } else {
                    setSubscription(null);
                }
            } catch (err) {
                console.error('Error fetching subscription:', err);
                setError(err.response?.data?.message || 'Failed to fetch subscription details');
                setSubscription(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user]);

    const refreshSubscription = async () => {
        try {
            const response = await api.get('/users/subscription-details/');
            if (response.data.success) {
                setSubscription(response.data.subscription);
            }
        } catch (err) {
            console.error('Error refreshing subscription:', err);
        }
    };

    const canJoinEvent = () => {
        if (!subscription) return false;
        return subscription.can_join_event;
    };

    const canCreateEvent = () => {
        if (!subscription) return false;
        return subscription.can_organize_event;
    };

    const getRemainingJoins = () => {
        if (!subscription) return 0;
        return subscription.remaining_joins || 0;
    };

    const getRemainingCreations = () => {
        if (!subscription) return 0;
        return subscription.remaining_creations || 0;
    };

    const isExpired = () => {
        if (!subscription) return true;
        return subscription.is_expired;
    };

    const isNearLimit = (type) => {
        if (!subscription) return false;
        
        if (type === 'join') {
            const percentage = subscription.plan.event_join_limit > 0 
                ? (subscription.events_joined_current_month / subscription.plan.event_join_limit) * 100 
                : 0;
            return percentage >= 80;
        }
        
        if (type === 'create') {
            const percentage = subscription.plan.event_creation_limit > 0 
                ? (subscription.events_organized_current_month / subscription.plan.event_creation_limit) * 100 
                : 0;
            return percentage >= 80;
        }
        
        return false;
    };

    return {
        subscription,
        loading,
        error,
        refreshSubscription,
        canJoinEvent,
        canCreateEvent,
        getRemainingJoins,
        getRemainingCreations,
        isExpired,
        isNearLimit,
    };
};
