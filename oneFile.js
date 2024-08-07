//MonsterSelection.js: 
import {
    Select, option, Button, HStack, Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    VStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react';
import axios from 'axios';

function MonsterSelection({ children, ...dataProp }) {


    const [monsters, setMonsters] = useState([]);
    const [selectedMonster, setSelectedMonster] = useState('');
    const [showTable, setShowTable] = useState(false);
    const [monsterStats, setMonsterStats] = useState([]);
    const [monsterHeader, setMonsterHeader] = useState([]);


    const handleOptionChange = (event) => {
        //console.log(event.target.value);
        setSelectedMonster(event.target.value);
    };

    const handleButtonClick = async () => {
        console.log(selectedMonster);
        if (selectedMonster !== '') {
            // Find the selected monster from the list
            const selected = Object.values(monsters).find(mon => mon == selectedMonster);

            //console.log(selected);
            if (selected) {
                try {
                    const response = await axios.get(`http://localhost:3001/api/data?name=${selectedMonster}`);
                    console.log(response);

                    setMonsterStats([response.data]);

                    const tempArray = [];
                    Object.keys(response.data[0]).forEach(key => {
                        if (key !== "_id" && key !== "level_0") {
                            tempArray.push(key);
                        }
                    })
                    if (tempArray.length != 0)
                        setMonsterHeader(tempArray);



                } catch (err) {
                    console.error("Error while getting monster table", err)
                }
                //console.log(monsterStats);
                setShowTable(true);
            } else {
                alert('Selected monster not found!');
            }
        } else {
            alert('Please select a monster');
        }
    };
    useEffect(() => {
        const fetchUniqueNames = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/monsterlist');
                setMonsters(response.data.sort());
            } catch (err) {
                console.error('Error fetching unique names:', err);
            }
        };

        fetchUniqueNames();
    }, []);
    useEffect(() => {
        console.log(monsterStats)
    }, [monsterStats]);
    // useEffect(() => {
    //     //"_id": { "$oid": "6622c202004492a2fee6632f" }
    //     setMonsters([{ "Name": "acidic-glavenus", "Part": "Head", "Sever": "43", "Blunt": "55", "Ranged": "45", "Fire": "20", "Water": "10", "Paralysis": "15", "Frost": "5", "Dragon": "15", "Stun": "100", "Stamina": "100" }])
    // }, []);
    return (
        <VStack>
            <HStack align='center' gap='2' >
                <Select placeholder='Select option' id='1' onChange={handleOptionChange}>
                    {
                        monsters.map((mon) => (<option value={mon} key={mon}>{mon}</option>))
                    }


                </Select>

                <Button
                    onClick={handleButtonClick}
                    size='md'
                    height='47px'
                    width='150px'
                    border='1px'>
                    Submit
                </Button>

            </HStack>
            {showTable && (<>
                <Table variant="simple" textColor={'black'}>
                    <TableCaption textColor={'black'}>
                        {selectedMonster}
                    </TableCaption>
                    <Thead>
                        <Tr>
                            {monsterHeader.map(n => {
                                return (<Th key={n} textColor={'black'}>{n}</Th>);
                            })}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {monsterStats[0].map((part, index) => {
                            return (<Tr key={index}>
                                <Td>{part.Part}</Td>
                                <Td>{part.Sever}</Td>
                                <Td>{part.Blunt}</Td>
                                <Td>{part.Ranged}</Td>
                                <Td>{part.Fire}</Td>
                                <Td>{part.Water}</Td>
                                <Td>{part.Paralysis}</Td>
                                <Td>{part.Frost}</Td>
                                <Td>{part.Dragon}</Td>
                                <Td>{part.Stun}</Td>
                                <Td>{part.Stamina}</Td>
                            </Tr>);
                        })}
                    </Tbody>
                </Table>
            </>)}
        </VStack>
    );
};

export default MonsterSelection;

//app.js: 
const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = 3001;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.ynihqgb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const dbn = "MHW";
const coll = "Physiology";
const cors = require('cors');
const corsOptions = {
    origin: 'https://localhost:3000',//(https://your-client-app.com)
    optionsSuccessStatus: 200,
};
app.use(cors());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



app.get('/api/data', async (req, res) => {
    const queryName = req.query.name;

    if (!queryName) {
        return res.status(400).json({ error: 'Query name is required' });
    }
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        const db = client.db(dbn);
        const collection = db.collection(coll);

        // Fetch all documents
        const documents = await collection.find({ level_0: queryName }).toArray();
        res.json(documents);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    } finally {
        await client.close();
    }
});

app.get('/api/monsterlist', async (req, res) => {
    const uniqueNamesAggregation = [
        {
            $group: {
                _id: "$level_0", // Group by the 'name' field
                document: { $first: "$$ROOT" } // Get the first document for each unique name
            }
        },
        {
            $replaceRoot: { newRoot: "$document" } // Replace the root with the original document
        }
    ];
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const mycollection = client.db(dbn).collection(coll);
        const results = await mycollection.aggregate(uniqueNamesAggregation).toArray();
        const uniqueNames = results.map(doc => doc.level_0);
        res.json(uniqueNames);

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// async function run() {
//     const uniqueNamesAggregation = [
//         {
//             $group: {
//                 _id: "$level_0", // Group by the 'name' field
//                 document: { $first: "$$ROOT" } // Get the first document for each unique name
//             }
//         },
//         {
//             $replaceRoot: { newRoot: "$document" } // Replace the root with the original document
//         }
//     ];
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();
//         console.log('Connected successfully to MongoDB');
//         const mycollection = client.db(dbn).collection(coll);
//         const results = await mycollection.aggregate(uniqueNamesAggregation).toArray();
//         results.forEach((mon) => {
//             console.log(mon.level_0);
//         });

//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }

// run().catch(console.dir);MonsterSelection.js: 
import {
    Select, option, Button, HStack, Table,
    Thead,
    Tbody,
    Tfoot,
    Tr,
    Th,
    Td,
    TableCaption,
    TableContainer,
    VStack
} from '@chakra-ui/react'
import { useEffect, useState } from 'react';
import axios from 'axios';

function MonsterSelection({ children, ...dataProp }) {


    const [monsters, setMonsters] = useState([]);
    const [selectedMonster, setSelectedMonster] = useState('');
    const [showTable, setShowTable] = useState(false);
    const [monsterStats, setMonsterStats] = useState([]);
    const [monsterHeader, setMonsterHeader] = useState([]);


    const handleOptionChange = (event) => {
        //console.log(event.target.value);
        setSelectedMonster(event.target.value);
    };

    const handleButtonClick = async () => {
        console.log(selectedMonster);
        if (selectedMonster !== '') {
            // Find the selected monster from the list
            const selected = Object.values(monsters).find(mon => mon == selectedMonster);

            //console.log(selected);
            if (selected) {
                try {
                    const response = await axios.get(`http://localhost:3001/api/data?name=${selectedMonster}`);
                    console.log(response);

                    setMonsterStats([response.data]);

                    const tempArray = [];
                    Object.keys(response.data[0]).forEach(key => {
                        if (key !== "_id" && key !== "level_0") {
                            tempArray.push(key);
                        }
                    })
                    if (tempArray.length != 0)
                        setMonsterHeader(tempArray);



                } catch (err) {
                    console.error("Error while getting monster table", err)
                }
                //console.log(monsterStats);
                setShowTable(true);
            } else {
                alert('Selected monster not found!');
            }
        } else {
            alert('Please select a monster');
        }
    };
    useEffect(() => {
        const fetchUniqueNames = async () => {
            try {
                const response = await axios.get('http://localhost:3001/api/monsterlist');
                setMonsters(response.data.sort());
            } catch (err) {
                console.error('Error fetching unique names:', err);
            }
        };

        fetchUniqueNames();
    }, []);
    useEffect(() => {
        console.log(monsterStats)
    }, [monsterStats]);
    // useEffect(() => {
    //     //"_id": { "$oid": "6622c202004492a2fee6632f" }
    //     setMonsters([{ "Name": "acidic-glavenus", "Part": "Head", "Sever": "43", "Blunt": "55", "Ranged": "45", "Fire": "20", "Water": "10", "Paralysis": "15", "Frost": "5", "Dragon": "15", "Stun": "100", "Stamina": "100" }])
    // }, []);
    return (
        <VStack>
            <HStack align='center' gap='2' >
                <Select placeholder='Select option' id='1' onChange={handleOptionChange}>
                    {
                        monsters.map((mon) => (<option value={mon} key={mon}>{mon}</option>))
                    }


                </Select>

                <Button
                    onClick={handleButtonClick}
                    size='md'
                    height='47px'
                    width='150px'
                    border='1px'>
                    Submit
                </Button>

            </HStack>
            {showTable && (<>
                <Table variant="simple" textColor={'black'}>
                    <TableCaption textColor={'black'}>
                        {selectedMonster}
                    </TableCaption>
                    <Thead>
                        <Tr>
                            {monsterHeader.map(n => {
                                return (<Th key={n} textColor={'black'}>{n}</Th>);
                            })}
                        </Tr>
                    </Thead>
                    <Tbody>
                        {monsterStats[0].map((part, index) => {
                            return (<Tr key={index}>
                                <Td>{part.Part}</Td>
                                <Td>{part.Sever}</Td>
                                <Td>{part.Blunt}</Td>
                                <Td>{part.Ranged}</Td>
                                <Td>{part.Fire}</Td>
                                <Td>{part.Water}</Td>
                                <Td>{part.Paralysis}</Td>
                                <Td>{part.Frost}</Td>
                                <Td>{part.Dragon}</Td>
                                <Td>{part.Stun}</Td>
                                <Td>{part.Stamina}</Td>
                            </Tr>);
                        })}
                    </Tbody>
                </Table>
            </>)}
        </VStack>
    );
};

export default MonsterSelection;

app.js: 
const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const app = express();
const port = 3001;
const uri = `mongodb+srv://${process.env.USER}:${process.env.PASS}@cluster0.ynihqgb.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const dbn = "MHW";
const coll = "Physiology";
const cors = require('cors');
const corsOptions = {
    origin: 'https://localhost:3000',//(https://your-client-app.com)
    optionsSuccessStatus: 200,
};
app.use(cors());

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});



app.get('/api/data', async (req, res) => {
    const queryName = req.query.name;

    if (!queryName) {
        return res.status(400).json({ error: 'Query name is required' });
    }
    try {
        await client.connect();
        await client.db("admin").command({ ping: 1 });
        const db = client.db(dbn);
        const collection = db.collection(coll);

        // Fetch all documents
        const documents = await collection.find({ level_0: queryName }).toArray();
        res.json(documents);
    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    } finally {
        await client.close();
    }
});

app.get('/api/monsterlist', async (req, res) => {
    const uniqueNamesAggregation = [
        {
            $group: {
                _id: "$level_0", // Group by the 'name' field
                document: { $first: "$$ROOT" } // Get the first document for each unique name
            }
        },
        {
            $replaceRoot: { newRoot: "$document" } // Replace the root with the original document
        }
    ];
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        console.log('Connected successfully to MongoDB');
        const mycollection = client.db(dbn).collection(coll);
        const results = await mycollection.aggregate(uniqueNamesAggregation).toArray();
        const uniqueNames = results.map(doc => doc.level_0);
        res.json(uniqueNames);

    } catch (error) {
        console.error('An error occurred:', error);
        res.status(500).json({ error: 'An error occurred while fetching data' });
    } finally {
        // Ensures that the client will close when you finish/error
        await client.close();
    }
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});


// async function run() {
//     const uniqueNamesAggregation = [
//         {
//             $group: {
//                 _id: "$level_0", // Group by the 'name' field
//                 document: { $first: "$$ROOT" } // Get the first document for each unique name
//             }
//         },
//         {
//             $replaceRoot: { newRoot: "$document" } // Replace the root with the original document
//         }
//     ];
//     try {
//         // Connect the client to the server	(optional starting in v4.7)
//         await client.connect();
//         console.log('Connected successfully to MongoDB');
//         const mycollection = client.db(dbn).collection(coll);
//         const results = await mycollection.aggregate(uniqueNamesAggregation).toArray();
//         results.forEach((mon) => {
//             console.log(mon.level_0);
//         });

//     } finally {
//         // Ensures that the client will close when you finish/error
//         await client.close();
//     }
// }

// run().catch(console.dir);