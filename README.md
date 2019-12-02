![GitHub Logo](/centralityx_logo.png)


# CentralityX
Network Diagram with Centrality Measures for Qlik Sense

Built on D3.js V.4 with JSNetworkX (Javascript implementation of NetworkX).

## Description: 

Centrality Measures are well established network analysis algorithms that tell us how about the relationships in a network.
A Network is simply a group of Nodes associated together.
Nodes are simply entities, similar to Nouns in the English Language
Nodes are connected together via Edges.
Edges are simply the relationships between Nodes, similar to Verbs in the English Language.

## Why?:

Network Diagrams with Centrality Measures can quickly show us all the Entities and how they Entities are associated to other Entities together with the association relationship, the importance of each Entity and the strength of the relationships between entities.


## Get Started:

You will need at least 2 fields to use as NodeA and NodeB and you will need an edge element. The visualisation works best when you have an Edge Table, a Tables of NodeA and their properties, and a Table of NodeB and their properties ( 3 tables ). To take full advantage of the Qlik Associative Index I recommend that you perform a reverse duplication of the Edge table. This means that at the time that you duplicate your Edge table you will swap the values of NodeA and NodeB. This ensures that you can analyse your nodes and relationship from either A or B side and perform 'degrees of separation' analysis. You will be able to determine the relationship between nodes even if they are not directly connected, there may be x number of hops between two distinct nodes. An example application is included in the repository.