import { GetServerSideProps } from 'next';

/**
 * Redirects to the API endpoint for avatar upload
 */
export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  // Redirect to API endpoint
  res.writeHead(307, { Location: '/api/avatars/upload' });
  res.end();
  
  return {
    props: {},
  };
};

// This is necessary for getServerSideProps to work
const AvatarUploadPage = () => null;
export default AvatarUploadPage; 