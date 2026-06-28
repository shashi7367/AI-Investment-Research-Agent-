/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@langchain/langgraph', '@langchain/google-genai']
  }
}
module.exports = nextConfig
