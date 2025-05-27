use maf::*;

#[derive(Debug, serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Controls {
    pub drive: i8,
    pub steer: i8,
}

impl StoreData for Controls {
    type Data = Self;

    fn init() -> Self::Data {
        Self { drive: 0, steer: 0 }
    }

    fn select(data: &Self::Data) -> impl serde::Serialize {
        data
    }

    fn name() -> impl AsRef<str> + Send {
        "controls"
    }
}

async fn set_controls(controls: Store<Controls>, Params(new): Params<Controls>) {
    tracing::info!("setting controls: drive={}, steer={}", new.drive, new.steer);
    *controls.write().await = new;
}

async fn controls_hook(controls: Store<Controls>) -> String {
    let controls = controls.read().await;
    format!("{} {}", controls.drive, controls.steer)
}

pub struct ControlsPlugin;

impl Plugin for ControlsPlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        app.rpc("set_controls", set_controls)
            .hook("controls", controls_hook)
            .store::<Controls>()
    }
}
