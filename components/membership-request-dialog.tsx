'use client';

import { useTranslations } from 'next-intl';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Institution } from '@/lib/types';

interface MembershipRequestDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    institution: Institution | null;
    onConfirm: () => void;
}

export function MembershipRequestDialog({
    open,
    onOpenChange,
    institution,
    onConfirm,
}: MembershipRequestDialogProps) {
    const t = useTranslations();

    if (!institution) return null;

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{t('institutions.requestDialog.title')}</AlertDialogTitle>
                </AlertDialogHeader>
                <AlertDialogDescription>
                    {t('institutions.requestDialog.description', {
                        institution: institution.name,
                    })}
                </AlertDialogDescription>
                <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>
                        {t('institutions.requestDialog.confirm')}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
