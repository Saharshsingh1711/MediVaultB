interface Collections {
  PATIENT_RECORDS: {
    userId: string;
    content: string;
    createdAt: FirebaseFirestore.FieldValue;
  };
  USER_DATA_PATIENT: {
    userId: string;
    content: string;
    createdAt: FirebaseFirestore.FieldValue;
  };
  USER_DATA_DOC: {
    userId: string;
    content: string;
    createdAt: FirebaseFirestore.FieldValue;
  };
}
