import { GetServerSideProps } from 'next';

/**
 * Redirects to the API endpoint for avatars
 */
export const getServerSideProps: GetServerSideProps = async ({ params, res }) => {
  const filename = params?.filename as string;
  
  if (!filename) {
    return { notFound: true };
  }
  
  // Redirect to the API endpoint
  res.writeHead(307, { Location: `/api/avatars/${filename}` });
  res.end();
  
  return {
    props: {},
  };
};

// This is necessary for getServerSideProps to work
const AvatarPage = () => null;
export default AvatarPage; 