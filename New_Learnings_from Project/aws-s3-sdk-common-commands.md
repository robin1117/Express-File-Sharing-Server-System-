# AWS S3 SDK for JavaScript — Common Commands

## Install

```bash
npm install @aws-sdk/client-s3
```

## Basic Pattern

```js
const command = new SomeS3Command({
  // options
});

const result = await s3Client.send(command);
```

## Common S3 Commands

| Command | Purpose |
|---|---|
| `PutObjectCommand` | Upload a file/object |
| `GetObjectCommand` | Download/read an object |
| `DeleteObjectCommand` | Delete an object |
| `ListObjectsV2Command` | List objects in a bucket |
| `HeadObjectCommand` | Get object metadata |
| `CopyObjectCommand` | Copy an object |
| `DeleteObjectsCommand` | Delete multiple objects |
| `CreateMultipartUploadCommand` | Start multipart upload |
| `UploadPartCommand` | Upload one multipart part |
| `CompleteMultipartUploadCommand` | Complete multipart upload |
| `AbortMultipartUploadCommand` | Cancel multipart upload |

## Quick Memory

```text
PutObject       → Upload
GetObject       → Download
DeleteObject    → Delete
ListObjectsV2   → List
HeadObject      → Metadata
CopyObject      → Copy
Multipart       → Large/chunked files
```

## Example

```js
import {
  S3Client,
  PutObjectCommand
} from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "ap-south-1"
});

const command = new PutObjectCommand({
  Bucket: "my-bucket",
  Key: "images/photo.jpg",
  Body: fileBuffer,
  ContentType: "image/jpeg"
});

await s3Client.send(command);
```
