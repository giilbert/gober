use maf::*;

use crate::{
    error::RpcResult,
    video::{Admin, AdminStoreExt},
};

pub struct SensorsPlugin;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SensorData {
    pub o_beta: f32,
    pub o_gamma: f32,
    pub o_alpha: f32,

    pub a_x: f32,
    pub a_y: f32,
    pub a_z: f32,
}

impl StoreData for SensorData {
    type Data = Self;

    fn init() -> Self::Data {
        Self {
            o_beta: 0.0,
            o_gamma: 0.0,
            o_alpha: 0.0,
            a_x: 0.0,
            a_y: 0.0,
            a_z: 0.0,
        }
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data
    }
}

async fn update_sensor_data(
    user: User,
    admin: State<Admin>,
    store: Store<SensorData>,
    Params(data): Params<SensorData>,
) -> RpcResult<()> {
    admin.assert(user).await?;

    *store.write().await = data;

    Ok(())
}

impl Plugin for SensorsPlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        app.store::<SensorData>()
            .rpc("update_sensor_data", update_sensor_data)
    }
}
