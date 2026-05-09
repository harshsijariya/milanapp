package com.match.partner.common.service;

public interface S3ServiceInterface {
    String uploadFile(byte[] fileData, String fileName);
    String generatePresignedUrl(String fileName);
    String generatePresignedUploadUrl(String fileName, String contentType);
}