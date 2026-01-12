import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogout, useSignerStatus, useSmartAccountClient } from "@account-kit/react";
import Image from "next/image";

export default function Header() {
  const { logout } = useLogout();
  const { isConnected: isSignerConnected } = useSignerStatus();
  const { address } = useSmartAccountClient({});
  
  // Check if connected via signer status OR if address exists (for external wallets)
  // For external wallets, client is undefined but address is set
  const isConnected = isSignerConnected || !!address;

  return (
    <header className="border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Image
            src="/smart-wallets.svg"
            alt="Smart Wallets"
            width={200}
            height={26}
            className="h-6 w-auto"
          />
        </div>

        {isConnected && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => logout()}
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </Button>
        )}
      </div>
    </header>
  );
}
