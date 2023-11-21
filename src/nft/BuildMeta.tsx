import React, {useCallback, useState} from 'react';
import {Button, Form, Input, Space, Upload} from 'antd';
import TextArea from 'antd/es/input/TextArea';
import {UploadOutlined} from "@ant-design/icons";
import Link from 'antd/es/typography/Link';

const onFinishFailed = (errorInfo: any) => {
    console.log('Failed:', errorInfo);
};
const normFile = (e: any) => {
    const ret = e.fileList?.length ? e.file : undefined;
    console.log(`file ??`, ret)
    return ret
};

type FieldType = {
    root?: string;
    tokenId?: string;
    meta?: string;
    image?: File;
};
type StoreResult = {
    image: string, meta: string, loading: boolean
}
export const BuildMeta: React.FC = () => {
    const [form] = Form.useForm<FieldType>();
    const [v, setV] = useState<Partial<StoreResult>>({loading: true})
    const file = Form.useWatch('image', form)

    const onFinish = useCallback((values: any) => {
        console.log('submit:', values);
        const formData = new FormData()
        Object.keys(values).forEach(k=>formData.append(k, values[k]))
        setV({loading: true})
        fetch(`/nft-house/store`, {
            method: 'POST',
            body: formData
        }).then(res=>{
            return res.json()
        }).then(res=>{
            console.log(`response`,res)
            setV(res.data || res.message)
        })
    }, []);

    return (
        <Space direction={'vertical'} style={{}}>
        <Form
            form={form}
            name="basic"
            labelCol={{ span: 4 }}
            wrapperCol={{ span: 16 }}
            style={{ width: 800 }}
            initialValues={{ root: 'root', tokenId: '1', meta: JSON.stringify({
                    name: "my NFT",
                }, null, 4)}}
            onFinish={onFinish}
            onFinishFailed={onFinishFailed}
            autoComplete="off"
            encType={'multipart/form-data'}

        >
            <Form.Item<FieldType>
                label="Root"
                name="root"
                rules={[{ required: true}]}
            >
                <Input />
            </Form.Item>

            <Form.Item<FieldType>
                label="Token Id"
                name="tokenId"
                rules={[{ required: true}]}
            >
                <Input />
            </Form.Item>

            <Form.Item<FieldType>
                label={"Meta"}
                name="meta" rules={[{ required: true}]}
            >
                <TextArea rows={4} />
            </Form.Item>

            <Form.Item<FieldType>
                label={"Image"} name="image" getValueFromEvent={normFile} valuePropName="file"
            >
                {/*<Input type={'file'} id={'thatFileInMeta'}/>*/}
                <Upload name="logo" action="" listType="picture" maxCount={1} beforeUpload={()=>false}>
                    {!file && <Button icon={<UploadOutlined/>}>Click to upload</Button>}
                </Upload>
            </Form.Item>

            <Form.Item wrapperCol={{offset: 0}} label={""}>
                <Button type="primary" htmlType="submit">
                    Submit
                </Button>
            </Form.Item>
        </Form>
            {v?.meta &&
                <Space>Token URI: <Link href={`${v.meta}`} target={'_blank'}>{v.meta}</Link></Space>
            }
            {v?.image &&
                <Space>Image: <Link href={`${v.image}`} target={'_blank'}>{v.image}</Link></Space>
            }
            <div style={{color:'red'}}>
                { (v && !v.meta && !v.image && !v.loading) ? `${JSON.stringify(v)}` : "" }
            </div>
        </Space>
    );
}