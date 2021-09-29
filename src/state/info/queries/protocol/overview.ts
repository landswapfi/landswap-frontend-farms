import { useState, useEffect } from 'react'
import { request, gql } from 'graphql-request'
import { INFO_CLIENT } from 'config/constants/endpoints'
import { ProtocolData } from 'state/info/types'

interface PancakeFactory {
  totalTransactions: string
  totalVolumeUSD: string
  totalLiquidityUSD: string
}

interface OverviewResponse {
  pancakeFactories: PancakeFactory[]
}

/**
 * Latest Liquidity, Volume and Transaction count
 */
const getOverviewData = async (block?: number): Promise<{ data?: OverviewResponse; error: boolean }> => {
  try {
    const query = gql`query overview {
      pancakeFactories(
        ${block ? `block: { number: ${block}}` : ``} 
        first: 1) {
        totalTransactions
        totalVolumeUSD
        totalLiquidityUSD
      }
    }`
    const data = await request<OverviewResponse>(INFO_CLIENT, query)
    return { data, error: false }
  } catch (error) {
    console.error('Failed to fetch info overview', error)
    return { data: null, error: true }
  }
}

const formatPancakeFactoryResponse = (rawPancakeFactory?: PancakeFactory) => {
  if (rawPancakeFactory) {
    return {
      totalTransactions: parseFloat(rawPancakeFactory.totalTransactions),
      totalVolumeUSD: parseFloat(rawPancakeFactory.totalVolumeUSD),
      totalLiquidityUSD: parseFloat(rawPancakeFactory.totalLiquidityUSD),
    }
  }
  return null
}

interface ProtocolFetchState {
  error: boolean
  data?: ProtocolData
}

const useFetchProtocolData = (): ProtocolFetchState => {
  const [fetchState, setFetchState] = useState<ProtocolFetchState>({
    error: false,
  })

  useEffect(() => {
    const fetch = async () => {
      const { error, data } = await getOverviewData()
      const anyError = error
      const overviewData = formatPancakeFactoryResponse(data?.pancakeFactories?.[0])
      const allDataAvailable = overviewData
      if (anyError || !allDataAvailable) {
        setFetchState({
          error: true,
        })
      } else {
        
        // 24H transactions
        
        const protocolData: ProtocolData = {
          liquidityUSD: overviewData.totalLiquidityUSD,
        }
        setFetchState({
          error: false,
          data: protocolData,
        })
      }
    }
    
    
  }, [fetchState])

  return fetchState
}

export default useFetchProtocolData
