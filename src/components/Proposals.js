import { useEffect, useState } from 'react'
import Table from 'react-bootstrap/Table';
import Button from 'react-bootstrap/Button';
import ProgressBar from 'react-bootstrap/ProgressBar';
import { ethers } from 'ethers'

const Proposals = ({ provider, dao, proposals, quorum, setIsLoading }) => {
  const [userHasVoted, setUserHasVoted] = useState({});
  const [recipientBalance, setRecipientBalance] = useState({});

  const voteHandler = async (id) => {
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).vote(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reversed')
    }

    setIsLoading(true)
  }

  const finalizeHandler = async (id) => {
    try {
      const signer = await provider.getSigner()
      const transaction = await dao.connect(signer).finalizeProposal(id)
      await transaction.wait()
    } catch {
      window.alert('User rejected or transaction reverted')
    }

    setIsLoading(true)
  }

  useEffect(() => {
    const fetchUserHasVoted = async () => {
      const signer = await provider.getSigner();
      const userAddress = await signer.getAddress();
      let voted = {};

      for(let proposal of proposals) {
        voted[proposal.id] = await dao.getVotes(userAddress, proposal.id)
      }
      setUserHasVoted(voted);
      console.log(voted, 'this is voted')
    }
    fetchUserHasVoted();
  }, [proposals, provider, dao]);

  useEffect(() => {
    const fetchRecipientBalance = async () => {
      let recipientBalance = {};

      for(let proposal of proposals) {
        recipientBalance[proposal.id] = await dao.getRecipientBalance(proposal.id)
      }
      setRecipientBalance(recipientBalance);
      console.log(recipientBalance, 'this is recipientBalance')
    }
    fetchRecipientBalance();
  }, [proposals, provider, dao]);

  return (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>#</th>
          <th>Proposal Name</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Recipient Address</th>
          <th>Recipient Balance</th>
          <th>Status</th>
          <th>From Quorum</th>
          <th>Cast Vote</th>
          <th>Finalize</th>
        </tr>
      </thead>
      <tbody>
        {proposals.map((proposal, index) => (
          <tr key={index}>
            <td>{proposal.id.toString()}</td>
            <td>{proposal.name}</td>
            <td>{proposal.description}</td>
            <td>{ethers.utils.formatUnits(proposal.amount, 'ether')} ETH</td>
            <td>{proposal.recipient}</td>
            <td>{recipientBalance.toString()} ETH</td>
            <td>{proposal.finalized ? 'Approved' : 'In Progress'}</td>
            <td><ProgressBar now={proposal.votes.toString() / quorum * 100} label={`${proposal.votes.toString() / quorum * 100}%`} /></td>
            <td>
              {!proposal.finalized && !userHasVoted[proposal.id] && (
                <Button 
                  variant='primary'
                  style={{ width: '100%' }}
                  onClick={() => voteHandler(proposal.id)}
                >
                  Vote
                </Button>
              )}
            </td>
            <td>
              {!proposal.finalized && proposal.votes > quorum && (
                <Button
                  variant='primary'
                  style={{ width: '100%' }}
                  onClick={() => finalizeHandler(proposal.id)}
                >
                  Finalize
                </Button>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}

export default Proposals;
