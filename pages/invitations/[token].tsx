import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/router';
import { Card, CardBody, CardFooter, CardHeader } from '@heroui/card';
import { Button } from '@heroui/button';
import { Spinner } from '@heroui/spinner';
import { Chip } from '@heroui/chip';
import { Tooltip } from '@heroui/tooltip';
import { BuildingIcon, Mail, X } from '@/components/icons';
import { getInvitationByToken } from '@/lib/services/organizationService';
import { formatDateTime, formatRelativeTime } from '@/lib/utils/dateFormatter';
import { OrganizationInvitationModel } from '@/types/organization';
import { HeroUIProvider } from "@heroui/system";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { NextPageWithLayout } from '@/pages/_app';

const InvitationAcceptPage: NextPageWithLayout = () => {
  const router = useRouter();
  const { token, organization_id: queryOrgId } = router.query;
  
  // Using simple check for auth instead of the full useAuth hook
  // This prevents unwanted API calls to /api/organization
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Simple check for authentication without API calls
    const checkAuth = () => {
      const authData = localStorage.getItem('auth');
      const userData = localStorage.getItem('user');
      setIsAuthenticated(!!(authData && userData));
    };
    
    checkAuth();
  }, []);
  
  const [invitation, setInvitation] = useState<OrganizationInvitationModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch invitation details
  useEffect(() => {
    if (!token || typeof token !== 'string') return;
    
    const orgId = queryOrgId && typeof queryOrgId === 'string' ? queryOrgId : '';
    
    const fetchInvitation = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const invitationData = await getInvitationByToken(token, orgId);
        console.log('invitationData', invitationData);
        setInvitation(invitationData);
      } catch (err: any) {
        console.error('Failed to fetch invitation:', err);
        setError(err.response?.data?.message || 'This invitation is invalid or has expired');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchInvitation();
  }, [token, queryOrgId]);
  
  // Handle invitation acceptance
  const handleAcceptInvitation = async () => {
    if (!token || typeof token !== 'string' || !invitation) return;
    
    if (isAuthenticated) {
      // Redirect to the organization page if the user is already registered and authenticated
      router.push(`/organizations/${invitation.organization_id}`);
    } else {
      // Redirect to the register page with email prefilled
      const orgId = invitation.organization_id.toString();
      const params = new URLSearchParams({
        email: invitation.email,
        invitation_token: token,
        organization_id: orgId
      });
      
      router.push(`/auth/register?${params.toString()}`);
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spinner size="lg" />
      </div>
    );
  }
  
  return (
    <div className="flex justify-center items-center min-h-screen bg-default-50">
      <div className="max-w-md w-full px-4">
        <Card className="shadow-lg">
          <CardHeader className="flex gap-3 pb-0">
            <BuildingIcon size={36} className="text-primary" />
            <div>
              <h1 className="text-xl font-bold">Invitation to join organization</h1>
            </div>
          </CardHeader>
          
          <CardBody>
            {error && !invitation ? (
              <div className="py-6 text-center">
                <Mail size={48} className="mx-auto mb-3 text-danger" />
                <h3 className="text-lg font-semibold mb-1">Invalid Invitation</h3>
                <p className="text-default-500 mb-3">{error}</p>
                <Button onClick={() => router.push('/')}>
                  Go to Home
                </Button>
              </div>
            ) : invitation ? (
              <div className="space-y-6">
                {error && (
                  <div className="bg-danger-100 text-danger p-3 rounded-lg">
                    {error}
                  </div>
                )}
                
                <div className="space-y-4">
                  <div className="flex items-center border-b pb-4">
                    <div className="bg-primary-100 p-2 rounded-full mr-3">
                      <BuildingIcon size={24} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invitation.organization?.name || 'Organization'}</p>
                      <p className="text-sm text-default-500">
                        You've been invited to join this organization
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-b pb-4">
                    <h3 className="text-md font-medium mb-2">Invitation Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-default-500">Email:</span>
                        <span className="font-medium">{invitation.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">Role:</span>
                        <Chip size="sm" color="primary" variant="flat" className="capitalize">
                          {invitation.role}
                        </Chip>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">Invited:</span>
                        <Tooltip content={formatDateTime(invitation.updated_at)}>
                          <span>{formatRelativeTime(invitation.updated_at)}</span>
                        </Tooltip>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-default-500">Expires:</span>
                        <Tooltip content={formatDateTime(invitation.expires_at)}>
                          <span>{formatRelativeTime(invitation.expires_at)}</span>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                  
                  {invitation.status === 'pending' ? (
                    <div className="bg-primary-50 p-3 rounded-lg">
                      <p className="text-sm text-primary-700">
                        {isAuthenticated ? (
                          <>You can join this organization directly with your existing account.</>
                        ) : (
                          <>
                            By accepting this invitation, you will be redirected to 
                            create an account with {invitation.email}.
                          </>
                        )}
                      </p>
                    </div>
                  ) : invitation.status === 'accepted' ? (
                    <div className="bg-success-50 p-3 rounded-lg">
                      <p className="text-sm text-success-700">
                        This invitation has already been accepted.
                      </p>
                    </div>
                  ) : (
                    <div className="bg-danger-50 p-3 rounded-lg">
                      <p className="text-sm text-danger-700">
                        This invitation has expired. Please contact the organization administrator for a new invitation.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </CardBody>
          
          <CardFooter className="justify-end">
            <div className="flex gap-2">
              <Button
                variant="flat"
                onPress={() => router.push('/')}
                startContent={<X size={16} />}
              >
                Cancel
              </Button>
              
              {invitation?.status === 'pending' && (
                <Button
                  color="primary"
                  onPress={handleAcceptInvitation}
                  startContent={<Mail size={16} />}
                >
                  {isAuthenticated ? 'Join Organization' : 'Accept & Create Account'}
                </Button>
              )}
              
              {invitation?.status === 'accepted' && (
                <Button
                  color="primary"
                  onPress={() => router.push(`/organizations/${invitation.organization_id}`)}
                  startContent={<BuildingIcon size={16} />}
                >
                  Go to Organization
                </Button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

// Define a custom layout that skips the OrganizationProvider
InvitationAcceptPage.getLayout = (page: ReactElement) => {
  return (
    <HeroUIProvider>
      <NextThemesProvider>
        {page}
      </NextThemesProvider>
    </HeroUIProvider>
  );
};

export default InvitationAcceptPage; 