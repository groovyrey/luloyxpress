'use client';

import { useState } from 'react';
import { toggleFace2FA } from '@/lib/actions';
import { toast } from 'sonner';
import { Shield, ShieldAlert, ShieldCheck, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function Face2FASettings({ 
  userId, 
  initialEnabled 
}: { 
  userId: string, 
  initialEnabled: boolean 
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [loading, setLoading] = useState(false);

  const handleToggle = async (checked: boolean) => {
    setLoading(true);
    try {
      const result = await toggleFace2FA(checked);
      if (result.error) {
        toast.error(result.error);
      } else if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        setEnabled(checked);
        toast.success(`Face 2FA ${checked ? 'enabled' : 'disabled'}`);
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-zinc-100 shadow-sm mt-8 overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
              <Shield className="h-6 w-6" />
            </div>
            <div className="space-y-0.5">
              <Label htmlFor="face-2fa" className="text-sm font-bold text-zinc-900 cursor-pointer">
                Face Biometric 2FA
              </Label>
              <p className="text-xs text-zinc-500 font-medium">Secure your account with facial recognition</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
            <Switch
              id="face-2fa"
              checked={enabled}
              onCheckedChange={handleToggle}
              disabled={loading}
              className="data-[state=checked]:bg-blue-600"
            />
          </div>
        </div>

        <div className="mt-6 flex items-center">
          {enabled ? (
            <div className="flex items-center gap-2 text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100/50">
              <ShieldCheck className="h-3 w-3" />
              Protection Active
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-50 px-4 py-2 rounded-full border border-zinc-200/50">
              <ShieldAlert className="h-3 w-3" />
              Currently Disabled
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

