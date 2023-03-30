import React, { useState, useEffect } from 'react';
import './index.css'
import Web3 from 'web3';
import axios, * as others from 'axios';

// Create a new Web3 object and connect to the Alchemy API websocket endpoint for the Ethereum mainnet
const web3 = new Web3(new Web3.providers.WebsocketProvider("wss://eth-mainnet.alchemyapi.io/v2/GNauZOAEhjOc34zQQqQuXorOlmC6wJ6W"));

// Function to fetch the latest block's transactions and return them as an array of objects
async function getTransactions() {

  // Fetch the current price of ETH in USD using the CryptoCompare API
  var ethPriceAPIFetch = await axios.get('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD')
  var ethPrice = ethPriceAPIFetch.data.USD;
  
  // Create an empty array to store transaction objects
  var transactionsList = [];

  // Get the latest block number and fetch the block object
  const latestBlockNumber = await web3.eth.getBlockNumber();
  const block = await web3.eth.getBlock(latestBlockNumber);

  // Use the block object to fetch transaction objects for each transaction hash
  const transactionPromises = block.transactions.map((transactionHash) => {
    return web3.eth.getTransaction(transactionHash);
  });

  // Wait for all transaction promises to resolve, then add each transaction to the transactionsList array
  const transactions = await Promise.all(transactionPromises);
  transactions.forEach((transaction) => {
    var eth = web3.utils.fromWei(transaction.value, 'ether');
    var newTransaction = 
    {
      sender: transaction.from,
      reciever: transaction.to,
      ethVal: eth,
      USD: Math.round((eth * ethPrice) * 100) / 100
    }
    transactionsList.push(newTransaction);
  });
  
  // Return the transactionsList array
  return transactionsList;
}

// Define a React functional component named Transactions
function Transactions() {
    // Initialize a state variable named transactionList with an empty array using the useState() hook
    const [transactionList, setTransactionList] = useState([]);
  
    // Use the useEffect() hook to fetch transactions when the component is mounted
    useEffect(() => {
      async function fetchTransactions() {
        const transactions = await getTransactions();
        setTransactionList(transactions);
      }
      fetchTransactions();
    }, []);

    // Subscribe to newBlockHeaders events using the web3.eth.subscribe() method
    web3.eth.subscribe('newBlockHeaders', async (error, result) => {
      if (error) {
        console.error(error);
      } else {
        const transactions = await getTransactions();
        setTransactionList(transactions);
      }
    });
  
    // Return JSX that renders a list of transactions using the map() method
    return (
      <div className='Transactions'>
        <ul className="list-class" id="transactionList">
          {transactionList.map((transaction) => (
            <li>
              FROM: {transaction.sender} | TO: {transaction.reciever} | ETHER VALUE: {transaction.ethVal} | PRICE IN USD: ${transaction.USD}
            </li>
          ))}
        </ul>
      </div>
    );
}

// Export the Transactions component as the default export of this module
export default Transactions;