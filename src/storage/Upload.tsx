import React, {useCallback, useState} from 'react';
import {UploadOutlined} from '@ant-design/icons';
import {Button, Card, message, Space, Upload} from 'antd';
import type {UploadFile, UploadProps} from 'antd/es/upload/interface';
require("js-neurahive-sdk/dist/");

export const UploadElem: React.FC = () => {
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [v, setV] = useState({
        root: ''
    })

    const handleUpload = useCallback(async () => {
        const blob = fileList[0]
        console.log(`file is `, blob)
        const file = window.neurahive.NeurahiveFile.fromBlob(blob)
        const [tree, err] = await file.merkleTree();
        if (err) {
            message.error(`failed to build merkle tree: ${err}`)
            return
        }
        setV({root: tree!.rootHash()!})
        // const formData = new FormData();
        // setUploading(true);
        // You can use any AJAX library you like
        // fetch('https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188', {
        //     method: 'POST',
        //     body: formData,
        // })
        //     .then((res) => res.json())
        //     .then(() => {
        //         setFileList([]);
        //         message.success('upload successfully.');
        //     })
        //     .catch(() => {
        //         message.error('upload failed.');
        //     })
        //     .finally(() => {
        //         setUploading(false);
        //     });
    }, [fileList]);

    const props: UploadProps = {
        onRemove: (file) => {
            const index = fileList.indexOf(file);
            const newFileList = fileList.slice();
            newFileList.splice(index, 1);
            setFileList(newFileList);
        },
        beforeUpload: (file) => {
            setFileList([...fileList, file]);

            return false;
        },
        fileList,
    };

    return (
        <Card>
            <script src={'./neurahive.umd.js'}></script>\
            <Space direction={'vertical'}>
                <Upload {...props}>
                    <Button icon={<UploadOutlined/>}>Select File</Button>
                </Upload>
                <div>Root: {v.root}</div>
                <Button
                    type="primary"
                    onClick={handleUpload}
                    disabled={fileList.length === 0}
                    loading={uploading}
                    style={{marginTop: 16}}
                >
                    {uploading ? 'Uploading' : 'Start Upload'}
                </Button>
            </Space>
        </Card>
    );
};