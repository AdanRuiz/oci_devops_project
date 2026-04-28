package com.springboot.MyTodoList.service.rag;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;

public final class VectorMath {

    private VectorMath() {}

    public static byte[] floatsToBytes(float[] vec) {
        ByteBuffer bb = ByteBuffer.allocate(vec.length * 4).order(ByteOrder.LITTLE_ENDIAN);
        bb.asFloatBuffer().put(vec);
        return bb.array();
    }

    public static float[] bytesToFloats(byte[] bytes) {
        if (bytes.length % 4 != 0) {
            throw new IllegalArgumentException("BLOB length not divisible by 4: " + bytes.length);
        }
        ByteBuffer bb = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN);
        float[] out = new float[bytes.length / 4];
        bb.asFloatBuffer().get(out);
        return out;
    }

    public static double norm(float[] v) {
        double s = 0.0;
        for (float x : v) s += (double) x * x;
        return Math.sqrt(s);
    }

    public static double cosine(float[] a, double normA, float[] b, double normB) {
        if (a.length != b.length) {
            throw new IllegalArgumentException("Dim mismatch: " + a.length + " vs " + b.length);
        }
        if (normA == 0.0 || normB == 0.0) return 0.0;
        double dot = 0.0;
        for (int i = 0; i < a.length; i++) {
            dot += (double) a[i] * b[i];
        }
        return dot / (normA * normB);
    }
}
