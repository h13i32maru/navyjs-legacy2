#include "n_project.h"
#include "window/n_text_dialog.h"
#include "n_config_app_widget.h"
#include "ui_n_config_app_widget.h"
#include "extend/n_completer.h"

#include <QMenu>
#include <QDebug>

NConfigAppWidget::NConfigAppWidget(const QString &filePath, QWidget *parent) : NFileWidget(filePath, parent), ui(new Ui::NConfigAppWidget)
{
    ui->setupUi(this);

    ui->appTouchIcon->setType(NTextListSelector::IMAGE);
    ui->appStartScene->setType(NTextListSelector::SCENE);
    ui->appLoadingSrc->setType(NTextListSelector::IMAGE);

    ui->appTouchIcon->setAllowEmpty(true);
    ui->appLoadingSrc->setAllowEmpty(true);

    mConfigApp.parseFromFilePath(filePath);

    syncJsonToWidget();

    connect(this, SIGNAL(customContextMenuRequested(QPoint)), this, SLOT(contextMenu(QPoint)));
    connect(ui->appName, SIGNAL(textChanged(QString)), this, SLOT(changed()));
    connect(ui->appTouchIcon, SIGNAL(textChanged(QString)), this, SLOT(changed()));
    connect(ui->appSizeWidth, SIGNAL(valueChanged(int)), this, SLOT(changed()));
    connect(ui->appSizeHeight, SIGNAL(valueChanged(int)), this, SLOT(changed()));
    connect(ui->appStartScene, SIGNAL(textChanged(QString)), this, SLOT(changed()));
    connect(ui->appFontFamily, SIGNAL(textChanged(QString)), this, SLOT(changed()));
    connect(ui->appLoadingSrc, SIGNAL(textChanged(QString)), this, SLOT(changed()));

    refreshForActive();
}

void NConfigAppWidget::refreshForActive() {
}

bool NConfigAppWidget::innerSave() {
    syncWidgetToJson();

    QFile configAppFile(mFilePath);
    if (!configAppFile.open(QIODevice::WriteOnly | QIODevice::Text)) {
        return false;
    }

    int ret = configAppFile.write(this->mConfigApp.stringify());

    return (ret == -1 ? false : true);
}

void NConfigAppWidget::syncJsonToWidget() {
    ui->appName->setText(mConfigApp.getStr("name"));
    ui->appTouchIcon->setText(mConfigApp.getStr("touchIcon"));
    ui->appSizeWidth->setValue(mConfigApp.getInt("size.width"));
    ui->appSizeHeight->setValue(mConfigApp.getInt("size.height"));
    ui->appStartScene->setText(mConfigApp.getStr("start.scene"));
    ui->appFontFamily->setText(mConfigApp.getStr("fontFamily"));
    ui->appLoadingSrc->setText(mConfigApp.getStr("loading.src"));
}

void NConfigAppWidget::syncWidgetToJson() {
    mConfigApp.set("name", ui->appName->text());
    mConfigApp.set("touchIcon", ui->appTouchIcon->text());
    mConfigApp.set("size.width", ui->appSizeWidth->value());
    mConfigApp.set("size.height", ui->appSizeHeight->value());
    mConfigApp.set("start.scene", ui->appStartScene->text());
    mConfigApp.set("fontFamily", ui->appFontFamily->text());
    mConfigApp.set("loading.src", ui->appLoadingSrc->text());
}

void NConfigAppWidget::contextMenu(QPoint /*point*/) {
    QMenu menu(this);
    menu.addSeparator();
    menu.addAction(tr("&Raw Data"), this, SLOT(showRawData()));
    menu.exec(QCursor::pos());
}

void NConfigAppWidget::showRawData() {
    NTextDialog dialog(this);
    this->syncWidgetToJson();
    dialog.setText(mConfigApp.stringify());
    dialog.exec();
}

NConfigAppWidget::~NConfigAppWidget()
{
    delete ui;
}
