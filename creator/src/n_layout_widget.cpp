#include "n_layout_widget.h"
#include "native_bridge.h"
#include "ui_n_layout_widget.h"
#include "window/n_text_dialog.h"
#include "util/n_util.h"
#include "n_project.h"
#include "plugin/view_plugin.h"

#include <QWebView>
#include <QWebFrame>
#include <QMessageBox>
#include <QMenu>
#include <QWebInspector>
#include <QDebug>
#include <QList>
#include <QLineEdit>
#include <QSpinBox>
#include <QTableView>

#include <QStandardItemModel>

#include <window/n_layout_setting_dialog.h>
#include <ui_n_layout_setting_dialog.h>

const QString NLayoutWidget::HtmlFilePath = "index_creator.html";

NLayoutWidget::NLayoutWidget(const QString &filePath, QWidget *parent) : NFileWidget(filePath, parent), ui(new Ui::NLayoutWidget)
{
    ui->setupUi(this);

    refreshForActive();

    QWebView *webView = ui->webView;
    QWebSettings *settings = webView->settings();
    QWebSettings::setObjectCacheCapacities(0, 0, 0);
    settings->setAttribute(QWebSettings::LocalContentCanAccessRemoteUrls, true);
    settings->setAttribute(QWebSettings::DeveloperExtrasEnabled, true);
    settings->setAttribute(QWebSettings::AcceleratedCompositingEnabled, false);

    mNative = new NativeBridge(this);
    QString layoutPath = NProject::instance()->relativeLayoutFilePath(filePath);
    mNative->setLayoutPath(layoutPath);
    injectNativeBridge();

    connect(ui->layerToggleButton, SIGNAL(clicked()), this, SLOT(toggleLayerTreeWidget()));
    connect(ui->propToggleButton, SIGNAL(clicked()), this, SLOT(toggleLayoutPropWidget()));
    connect(ui->viewToggleButton, SIGNAL(clicked()), this, SLOT(toggleViewClassTreeWidget()));

    reload();

    connect(ui->viewClassTreeWidget, SIGNAL(itemDoubleClicked(QTreeWidgetItem*,int)), this, SLOT(addViewToJS(QTreeWidgetItem*, int)));
    connect(ui->layerTreeWidget, SIGNAL(changedTreeByDrop(QTreeWidgetItem *)), this, SLOT(updateViewsToJS(QTreeWidgetItem*)));
    connect(ui->layerTreeWidget, SIGNAL(itemSelectionChanged()), this, SLOT(selectViewToJS()));
    connect(ui->layerTreeWidget, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForViewsTree(QPoint)));
    connect(ui->webView, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenuForWebView(QPoint)));
    connect(webView->page()->mainFrame(), SIGNAL(javaScriptWindowObjectCleared()), this, SLOT(injectNativeBridge()));
    connect(mNative, SIGNAL(changedLayoutContentFromJS()), this, SLOT(changed()));
    connect(mNative, SIGNAL(viewsFromJS(NJson)), this, SLOT(setViewsFromJS(NJson)));
    connect(mNative, SIGNAL(metaFromJS(NJson)), this, SLOT(setMetaFromJS(NJson)));
    connect(mNative, SIGNAL(selectedViewsFromJS(NJson)), this, SLOT(setSelectedsViewsFromJS(NJson)));
    connect(mNative, SIGNAL(currentViewPosFromJS(int,int)), this, SLOT(setViewPosFromJS(int,int)));
    connect(mNative, SIGNAL(currentViewSizeFromJS(int,int)), this, SLOT(setViewSizeFromJS(int,int)));

    // create property widget for view.
    ViewPlugin::instance()->createTableView(ui->propScrollAreaWidgetContents, &mPropMap, &mDefaultMap, this, SLOT(syncWidgetToView()));
    mCurrentExtraTableWidget = NULL;
    mPropMap["Navy.View.View"]->show();
    QStringList viewClassNames = mPropMap.keys();
    for (QString className: viewClassNames) {
        QTreeWidgetItem *item = new QTreeWidgetItem();
        QString label = className.split(".").last();
        item->setText(ViewClassColName, label);
        item->setText(ViewClassColClass, className);
        ui->viewClassTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutWidget::toggleLayerTreeWidget() {
    ui->layerTreeWidget->setVisible(ui->layerTreeWidget->isVisible() ^ true);
}

void NLayoutWidget::toggleLayoutPropWidget() {
    ui->scrollArea->setVisible(ui->scrollArea->isVisible() ^ true);
}

void NLayoutWidget::toggleViewClassTreeWidget() {
    ui->viewClassTreeWidget->setVisible(ui->viewClassTreeWidget->isVisible() ^ true);
}

void NLayoutWidget::showLayoutSettingDialog() {
    int ret = mLayoutSettingDialog.exec();
    if (ret != NLayoutSettingDialog::Accepted) {
        return;
    }

    QString sceneId = mLayoutSettingDialog.ui->screenScene->currentText();
    QString pageId = mLayoutSettingDialog.ui->screenPage->currentText();
    bool enable = mLayoutSettingDialog.ui->screenEnable->isChecked();
    emit mNative->setScreenToJS(sceneId, pageId, enable);

    // screenのせっていでもレイアウトが変更されるのでchangedを発行する.
    changed();
}

bool NLayoutWidget::innerSave() {
    QString contentLayoutJsonText = this->contentLayoutJsonText();

    QFile file(mFilePath);

    if (!file.open(QFile::WriteOnly | QFile::Text)) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail open file.") + "\n" + mFilePath);
        return false;
    }
    int ret = file.write(contentLayoutJsonText.toUtf8());
    if (ret == -1) {
        QMessageBox::critical(this, tr("fail save file."), tr("fail save file.") + "\n" + mFilePath);
        return false;
    }

    return true;
}

void NLayoutWidget::refreshForActive() {
    // TODO: ここでimageListやlayoutListを更新する.
}

QString NLayoutWidget::contentLayoutJsonText() const {
    QWebFrame *frame = ui->webView->page()->mainFrame();
    QVariant variant = frame->evaluateJavaScript("window.CreatorPageInstance.getContentLayout();");
    return variant.toString();
}

void NLayoutWidget::injectNativeBridge (){
    QWebView *webView = ui->webView;
    webView->page()->mainFrame()->addToJavaScriptWindowObject(QString("Native"), mNative);
}

void NLayoutWidget::syncWidgetToView() {
    QList<QTreeWidgetItem *> items = ui->layerTreeWidget->selectedItems();
    if (items.length() != 1) {
        return;
    }

    QTableWidget *table = mPropMap["Navy.View.View"];
    QTableWidget *extraTable = mCurrentExtraTableWidget;
    NJson view;
    ViewPlugin::instance()->syncWidgetToView(view, table, extraTable);

    QString selectedViewId = items[0]->text(ViewsColId);
    QString id = view.getStr("id");
    if (id != selectedViewId) {
        QList<QTreeWidgetItem *> sameIdItems = ui->layerTreeWidget->findItems(id, Qt::MatchFixedString, ViewsColId);
        if (sameIdItems.length() != 0) {
            QMessageBox::critical(NULL, "Error", "same id is exists.");
            return;
        }

        items[0]->setText(ViewsColId, id);
    }

    emit mNative->changedViewPropertyToJS(view.toVariant());
}

/***************************************************
 * context menu
 **************************************************/
void NLayoutWidget::contextMenuForViewsTree(const QPoint &point) {
    QMenu menu(this);

    menu.addAction(tr("&Delete Selected Views"), this, SLOT(deleteSelectedViewsToJS()));

    // 選択されたところに行があるときしかメニューを表示しない
    QModelIndex index = ui->layerTreeWidget->indexAt(point);
    if (index.isValid()) {
        menu.exec(QCursor::pos());
    } else {
        ui->layerTreeWidget->clearSelection();
    }
}

void NLayoutWidget::contextMenuForWebView(const QPoint &/*point*/) {
    QMenu menu(this);

    QMenu *alignmentSubMenu = menu.addMenu(tr("&Alignment"));
    alignmentSubMenu->addAction(tr("&Left Alignment"), this, SLOT(alignLeftToJS()));
    alignmentSubMenu->addAction(tr("&Center Alignment"), this, SLOT(alignHCenterToJS()));
    alignmentSubMenu->addAction(tr("&Right Alignment"), this, SLOT(alignRightToJS()));
    alignmentSubMenu->addSeparator();
    alignmentSubMenu->addAction(tr("&Top Alignment"), this, SLOT(alignTopToJS()));
    alignmentSubMenu->addAction(tr("&Center Alignment"), this, SLOT(alignVCenterToJS()));
    alignmentSubMenu->addAction(tr("&Bottom Alignment"), this, SLOT(alignBottomToJS()));

    QMenu *rootAlignmentSubMenu = menu.addMenu(tr("&Root Alignment"));
    rootAlignmentSubMenu->addAction(tr("&Left"), this, SLOT(alignRootLeftToJS()));
    rootAlignmentSubMenu->addAction(tr("&Center"), this, SLOT(alignRootHCenterToJS()));
    rootAlignmentSubMenu->addAction(tr("&Right"), this, SLOT(alignRootRightToJS()));
    rootAlignmentSubMenu->addSeparator();
    rootAlignmentSubMenu->addAction(tr("&Top"), this, SLOT(alignRootTopToJS()));
    rootAlignmentSubMenu->addAction(tr("&Center"), this, SLOT(alignRootVCenterToJS()));
    rootAlignmentSubMenu->addAction(tr("&Bottom"), this, SLOT(alignRootBottomToJS()));

    QMenu *arrangementSubMenu = menu.addMenu(tr("&Arrangement"));
    arrangementSubMenu->addAction(tr("&Horizontal Closely"), this, SLOT(arrangeHorizontalClosely()));
    arrangementSubMenu->addAction(tr("&Vertical Closely"), this, SLOT(arrangeVerticalClosely()));
    arrangementSubMenu->addSeparator();
    arrangementSubMenu->addAction(tr("&Horizontal Even"), this, SLOT(arrangeHorizontalEven()));
    arrangementSubMenu->addAction(tr("&Vertical Even"), this, SLOT(arrangeVerticalEven()));

    menu.addSeparator();

    menu.addAction(tr("&Grouping Views"), this, SLOT(groupingViews()));
    menu.addAction(tr("&Ungrouping Views"), this, SLOT(ungroupingViews()));

    menu.addSeparator();

    menu.addAction(tr("&Delete Selected Views"), this, SLOT(deleteSelectedViewsToJS()));

    menu.addSeparator();

    menu.addAction(tr("&Setting"), this, SLOT(showLayoutSettingDialog()));
    menu.addAction(tr("&Reload"), this ,SLOT(reload()));
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.addAction(tr("&Inspector"), this, SLOT(showInspector()));

    menu.exec(QCursor::pos());
}

/************************************************
 * for webview
 ************************************************/
void NLayoutWidget::reload() {
    QWebView *webView = ui->webView;
    QString htmlPath = "file://" + NProject::instance()->contentsFilePath(HtmlFilePath) + "#web_installer_db=false";
    webView->load(QUrl(htmlPath));
}

void NLayoutWidget::showRawData() {
    QString jsonText = contentLayoutJsonText();
    NTextDialog dialog(this);
    dialog.setText(jsonText);
    dialog.exec();
}

void NLayoutWidget::showInspector() {
    QWebPage *page = ui->webView->page();
    QWebInspector *inspector = new QWebInspector;
    inspector->setPage(page);
    inspector->show();
}

/*******************************************
 * from js method
 *******************************************/
void NLayoutWidget::setViewsFromJS(const NJson &views) {
    QTreeWidget *layerTreeWidget = ui->layerTreeWidget;
    layerTreeWidget->clear();
    for (int i = 0; i < views.length(); i++) {
        QStringList row;
        NUtil::expand(row, 2);
        QString index = QString::number(i);
        row[ViewsColId] = views.getStr(index + ".id");
        row[ViewsColClass] = views.getStr(index + ".class");

        QTreeWidgetItem *item = new QTreeWidgetItem(row);
        item->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);

        layerTreeWidget->addTopLevelItem(item);
    }
}

void NLayoutWidget::setMetaFromJS(const NJson &meta) {
    mLayoutSettingDialog.ui->screenEnable->setChecked(meta.getBool("screenEnable"));
    mLayoutSettingDialog.ui->screenScene->setCurrentText(meta.getStr("screenSceneId"));
    mLayoutSettingDialog.ui->screenPage->setCurrentText(meta.getStr("screenPageId"));
}

void NLayoutWidget::setSelectedsViewsFromJS(const NJson &views) {
    QTreeWidget *tree = ui->layerTreeWidget;
    tree->blockSignals(true);

    tree->clearSelection();

    // ExtendedSelectionの状態ではCtrlキーを押下しながらじゃないと複数のItemを選択することができない
    // なので、一時的にMultiSelectionに変更して複数のItemを選択できるようにする
    tree->setSelectionMode(QAbstractItemView::MultiSelection);
    for (int i = 0; i < views.length(); i++) {
        QString index = QString::number(i);
        QString viewId = views.getStr(index + ".id");
        QTreeWidgetItem *item = tree->findItems(viewId, Qt::MatchFixedString, 0)[0];
        tree->setCurrentItem(item);
    }
    tree->setSelectionMode(QAbstractItemView::ExtendedSelection);

    tree->blockSignals(false);

    // 選択しているViewが1つじゃない場合はどのViewの設定をいじればよいかがわからないので、ウィジェットを無効に設定しておく
    if (views.length() != 1) {
        ui->propScrollAreaWidgetContents->setEnabled(false);
    } else {
        ui->propScrollAreaWidgetContents->setEnabled(true);
    }

    // show prop widget for view class and sync views to widget
    QString className = views.getStr("0.class");
    if (mPropMap.contains(className)) {
        if (mCurrentExtraTableWidget != NULL) {
            mCurrentExtraTableWidget->hide();
        }
        mCurrentExtraTableWidget = mPropMap[className];
        mCurrentExtraTableWidget->show();

        // always show
        mPropMap["Navy.View.View"]->show();

        // sync
        NJson view = views.getObject("0");
        QTableWidget *table = mPropMap["Navy.View.View"];
        QTableWidget *extraTable = mPropMap[className];
        ViewPlugin::instance()->syncViewToWidget(view, table, extraTable);
    }
}

void NLayoutWidget::setViewPosFromJS(int x, int y) {
    QSpinBox *s;

    s = mPropMap["Navy.View.View"]->findChild<QSpinBox*>("number:pos.x");
    s->blockSignals(true);
    s->setValue(x);
    s->blockSignals(false);

    s = mPropMap["Navy.View.View"]->findChild<QSpinBox*>("number:pos.y");
    s->blockSignals(true);
    s->setValue(y);
    s->blockSignals(false);
}

void NLayoutWidget::setViewSizeFromJS(int width, int height) {
    QSpinBox *s;

    s = mPropMap["Navy.View.View"]->findChild<QSpinBox*>("number:size.width");
    s->blockSignals(true);
    s->setValue(width);
    s->blockSignals(false);

    s = mPropMap["Navy.View.View"]->findChild<QSpinBox*>("number:size.height");
    s->blockSignals(true);
    s->setValue(height);
    s->blockSignals(false);
}

/*************************************************
 * to js method
 *************************************************/
void NLayoutWidget::updateViewsToJS(QTreeWidgetItem *droppedItem) {
    NTreeWidget *tree = ui->layerTreeWidget;
    int layerNum = tree->topLevelItemCount();
    QStringList viewIds;
    for (int i = 0; i < layerNum; i++) {
        viewIds.append(tree->topLevelItem(i)->text(ViewsColId));
    }
    emit mNative->changedViewsOrderToJS(viewIds);

    // ドロップすることで選択されているviewが変更されるのでドロップされてviewを選択状態に戻す
    tree->setCurrentItem(droppedItem);
}

void NLayoutWidget::selectViewToJS() {
    QList <QTreeWidgetItem *> items = ui->layerTreeWidget->selectedItems();
    QStringList viewIds;
    for (int i = 0; i< items.length(); i++) {
        viewIds.append(items[i]->text(ViewsColId));
    }

    emit mNative->unselectAllViewsToJS();
    emit mNative->changedSelectedViewToJS(viewIds);
}

void NLayoutWidget::addViewToJS(QTreeWidgetItem *item, int /* index */) {
    QTreeWidget *tree = ui->layerTreeWidget;

    // viewIdがかぶってしまうのを防ぐためにループを回す
    QString viewId;
    {
        int suffix = 1;
        while (true) {
            viewId = item->text(ViewClassColName) + QString::number(tree->topLevelItemCount() + suffix);
            if (tree->findItems(viewId, Qt::MatchFixedString | Qt::MatchCaseSensitive).length() == 0) {
                break;
            }
            suffix++;
        }
    }
    QString viewClass = item->text(ViewClassColClass);

    QStringList row;
    NUtil::expand(row, 2);
    row[ViewsColId] = viewId;
    row[ViewsColClass] = viewClass;
    QTreeWidgetItem *viewsItem = new QTreeWidgetItem(row);
    viewsItem->setFlags(Qt::ItemIsDragEnabled | Qt::ItemIsEnabled | Qt::ItemIsSelectable | Qt::ItemNeverHasChildren);
    tree->addTopLevelItem(viewsItem);

    NJson viewJson = mDefaultMap["Navy.View.View"];
    NJson extraViewJson = mDefaultMap[viewClass];
    viewJson.set("extra", extraViewJson.getObject("extra"));

    emit mNative->addViewToJS(viewId, viewClass, viewJson.toVariant());
}

void NLayoutWidget::deleteSelectedViewsToJS() {
    QTreeWidget *tree = ui->layerTreeWidget;
    tree->blockSignals(true);
    QList <QTreeWidgetItem *> items = tree->selectedItems();
    for (int i = 0; i< items.length(); i++) {
        int index = tree->indexOfTopLevelItem(items[i]);
        tree->takeTopLevelItem(index);
    }
    tree->blockSignals(false);

    emit mNative->deleteSelectedViewsToJS();
}

NLayoutWidget::~NLayoutWidget()
{
    delete ui;
}
