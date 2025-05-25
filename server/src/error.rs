use maf::SendError;
use serde::Serialize;

#[derive(Debug, thiserror::Error)]
pub enum RpcError {
    #[error("admin user not connected")]
    AdminNotConnected,
    #[error("user is not an admin")]
    NotAdmin,
    #[error("user not found")]
    UserNotFound,
    #[error("other")]
    Other(Box<dyn std::error::Error + Send + Sync>),
}

impl From<SendError> for RpcError {
    fn from(err: SendError) -> Self {
        RpcError::Other(Box::new(err))
    }
}

impl Serialize for RpcError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&self.to_string())
    }
}

pub type RpcResult<T> = Result<T, RpcError>;
