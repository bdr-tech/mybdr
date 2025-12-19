# frozen_string_literal: true

class CommunityCommentsController < ApplicationController
  before_action :require_login
  before_action :set_post
  before_action :set_comment, only: [:destroy]
  before_action :require_comment_author, only: [:destroy]

  def create
    @comment = @post.comments.build(comment_params)
    @comment.user = current_user

    if @comment.save
      respond_to do |format|
        format.html { redirect_to community_post_path(@post, anchor: "comment-#{@comment.id}"), notice: "댓글이 작성되었습니다." }
        format.turbo_stream
      end
    else
      respond_to do |format|
        format.html { redirect_to community_post_path(@post), alert: @comment.errors.full_messages.join(", ") }
        format.turbo_stream { render turbo_stream: turbo_stream.replace("comment-form", partial: "community_comments/form", locals: { post: @post, comment: @comment }) }
      end
    end
  end

  def destroy
    @comment.soft_delete!

    respond_to do |format|
      format.html { redirect_to community_post_path(@post), notice: "댓글이 삭제되었습니다." }
      format.turbo_stream
    end
  end

  private

  def set_post
    @post = CommunityPost.find_by_public_id(params[:community_post_id]) || CommunityPost.find(params[:community_post_id])
  end

  def set_comment
    @comment = @post.comments.find(params[:id])
  end

  def require_comment_author
    unless @comment.editable_by?(current_user)
      redirect_to community_post_path(@post), alert: "권한이 없습니다."
    end
  end

  def comment_params
    params.require(:comment).permit(:content, :parent_id)
  end
end
