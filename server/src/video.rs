use maf::{serde_json::Value, *};

use crate::error::{RpcError, RpcResult};

pub struct Admin {
    id: Uuid,
}

pub trait AdminStoreExt {
    async fn get(&self, app: &App) -> RpcResult<User>;
    async fn assert(&self, user: User) -> RpcResult<()>;
}

impl AdminStoreExt for State<Admin> {
    async fn get(&self, app: &App) -> RpcResult<User> {
        let admin = self.read().await;
        Ok(app
            .user(admin.id)
            .await
            .ok_or(RpcError::AdminNotConnected)?)
    }

    async fn assert(&self, user: User) -> RpcResult<()> {
        if user.meta.id() != self.read().await.id {
            return Err(RpcError::NotAdmin);
        }

        Ok(())
    }
}

async fn start_viewer(user: User, admin: State<Admin>, app: App) -> RpcResult<()> {
    let admin = admin.get(&app).await?;

    app.channel::<Uuid>("new_viewer")
        .send(&admin, user.meta.id())
        .expect("failed to send start_viewer message");

    Ok(())
}

async fn join_admin(user: User, admin: State<Admin>, Params(secret): Params<String>) -> bool {
    const ADMIN_SECRET: &str = include_str!("../ADMIN_SECRET");

    if secret != ADMIN_SECRET {
        false
    } else {
        admin.write().await.id = user.meta.id();
        tracing::debug!("user {user_id} joined as admin", user_id = user.meta.id());
        true
    }
}

async fn admin_send_ice_candidate(
    user: User,
    admin: State<Admin>,
    app: App,
    Params((viewer_id, candidate)): Params<(Uuid, Value)>,
) -> RpcResult<()> {
    admin.assert(user).await?;

    let viewer = app.user(viewer_id).await.ok_or(RpcError::UserNotFound)?;

    // tracing::debug!("admin send ice candidate: viewer={viewer_id}, candidate={candidate}");

    app.channel::<Value>("ice_candidate")
        .send(&viewer, candidate)?;

    Ok(())
}

async fn viewer_send_ice_candidate(
    user: User,
    admin: State<Admin>,
    app: App,
    Params(candidate): Params<Value>,
) -> RpcResult<()> {
    let admin_user = admin.get(&app).await?;

    // tracing::debug!("viewer send ice candidate: candidate={candidate:?}");

    app.channel::<(Uuid, Value)>("ice_candidate")
        .send(&admin_user, (user.meta.id(), candidate))?;

    Ok(())
}

async fn viewer_offer_response(
    user: User,
    admin: State<Admin>,
    app: App,
    Params((viewer_id, sdp)): Params<(Uuid, String)>,
) -> RpcResult<()> {
    admin.assert(user).await?;

    let user = app.user(viewer_id).await.ok_or(RpcError::UserNotFound)?;

    // tracing::debug!("viewer offer response: viewer={viewer_id}");

    app.channel::<String>("viewer_offer_response")
        .send(&user, sdp)?;

    Ok(())
}

async fn viewer_answer(
    user: User,
    admin: State<Admin>,
    app: App,
    Params(sdp): Params<String>,
) -> RpcResult<()> {
    let admin_user = admin.get(&app).await?;

    // tracing::debug!("finalize viewer: viewer={}", user.meta.id());

    app.channel::<(Uuid, String)>("finalize_viewer")
        .send(&admin_user, (user.meta.id(), sdp))?;

    Ok(())
}

pub struct VideoPlugin;

impl Plugin for VideoPlugin {
    fn build(&self, app: AppBuilder) -> AppBuilder {
        tracing::info!("video plugin loaded!");

        app.state(Admin { id: Uuid::nil() })
            .rpc("join_admin", join_admin)
            .rpc("start_viewer", start_viewer)
            .rpc("viewer_offer_response", viewer_offer_response)
            .rpc("viewer_answer", viewer_answer)
            .rpc("admin_send_ice_candidate", admin_send_ice_candidate)
            .rpc("viewer_send_ice_candidate", viewer_send_ice_candidate)
    }
}
