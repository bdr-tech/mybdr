# frozen_string_literal: true

class CommunityController < ApplicationController
  include Pagy::Backend

  before_action :require_login, except: [:index, :show]
  before_action :set_post, only: [:show, :edit, :update, :destroy]
  before_action :require_author, only: [:edit, :update, :destroy]

  def index
    posts = CommunityPost.published.includes(:user)

    # 카테고리 필터
    if params[:category].present?
      posts = posts.where(category: params[:category])
    end

    # 검색
    if params[:q].present?
      posts = posts.where("title ILIKE :q OR content ILIKE :q", q: "%#{params[:q]}%")
    end

    @pagy, @posts = pagy(posts.order(created_at: :desc), items: 20)
  end

  def show
    @post.increment!(:view_count) if @post.persisted?
  end

  def new
    @post = CommunityPost.new
    # 카테고리 파라미터가 있으면 자동 선택
    @post.category = params[:category] if params[:category].present? && CommunityPost::CATEGORIES.include?(params[:category])
  end

  def create
    @post = current_user.community_posts.build(post_params)
    @post.status = "published"

    if @post.save
      redirect_to community_post_path(@post), notice: "게시글이 작성되었습니다."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @post.update(post_params)
      redirect_to community_post_path(@post), notice: "게시글이 수정되었습니다."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @post.destroy
    redirect_to community_path, notice: "게시글이 삭제되었습니다."
  end

  private

  def set_post
    @post = CommunityPost.find_by_public_id(params[:id]) || CommunityPost.find(params[:id])
  end

  def require_author
    unless @post.user == current_user || current_user&.admin?
      redirect_to community_path, alert: "권한이 없습니다."
    end
  end

  def post_params
    params.require(:community_post).permit(
      :title, :content, :category,
      # 팀원 모집용
      :team_id,
      # 농구장 정보용
      :latitude, :longitude, :location_name, :location_address,
      # 장터용
      :price, :negotiable, :share_contact, :trade_status
    )
  end
end
